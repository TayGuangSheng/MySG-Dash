import { NextRequest } from "next/server";

type LtaBusResponse = {
  BusStopCode: string;
  Services: Array<{
    ServiceNo: string;
    NextBus: Partial<LtaBusTiming>;
    NextBus2: Partial<LtaBusTiming>;
    NextBus3: Partial<LtaBusTiming>;
    Status?: string;
  }>;
  Message?: string;
};

type LtaBusTiming = {
  EstimatedArrival: string;
  Load?: "SEA" | "SDA" | "LSD";
};

type BusArrival = {
  etaMin: number;
  load?: "SEA" | "SDA" | "LSD";
};

type BusServiceEta = {
  service: string;
  arrivals: BusArrival[];
  status?: string;
};

type BusApiResponse = {
  etas: BusServiceEta[];
  updatedAt: string;
  note?: string;
};

type BusRoutesResponse = {
  value?: Array<{
    ServiceNo: string;
    BusStopCode: string;
  }>;
  "@odata.nextLink"?: string;
};

const BUS_ARRIVAL_ENDPOINT = "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival";
const BUS_ROUTES_ENDPOINT = "https://datamall2.mytransport.sg/ltaodataservice/BusRoutes";
const BUS_ROUTES_PAGE_SIZE = 500;
const BUS_ROUTES_CACHE_MS = 6 * 60 * 60 * 1000;

const busRoutesCache = new Map<string, { timestamp: number; services: string[] }>();

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stop = searchParams.get("stop");

  if (!stop) {
    return Response.json({ error: "Missing stop parameter" }, { status: 400 });
  }

  const accountKey = process.env.LTA_ACCOUNT_KEY;
  if (!accountKey) {
    return Response.json({ error: "LTA_ACCOUNT_KEY environment variable is not configured." }, { status: 500 });
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    AccountKey: accountKey,
  };

  try {
    const apiUrl = new URL(BUS_ARRIVAL_ENDPOINT);
    apiUrl.searchParams.set("BusStopCode", stop);

    const response = await fetch(apiUrl, {
      headers,
      next: { revalidate: 15 },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Bus API error", response.status, text);
      return Response.json(
        { error: `LTA BusArrival API responded with status ${response.status}` },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as LtaBusResponse;
    const now = Date.now();

    const etas: BusServiceEta[] = payload.Services.map((service) => {
      const arrivals = [service.NextBus, service.NextBus2, service.NextBus3]
        .map((entry) => normaliseArrival(entry, now))
        .filter((arrival): arrival is BusArrival => arrival !== null)
        .slice(0, 3);

      return {
        service: service.ServiceNo,
        arrivals,
        status: service.Status,
      };
    });

    const routesForStop = await getServicesForStop(stop, headers);
    const existingServices = new Set(etas.map((item) => item.service));
    const missingServices = routesForStop.filter((service) => !existingServices.has(service));

    for (const service of missingServices) {
      etas.push({ service, arrivals: [], status: "No arrival data" });
    }

    etas.sort((a, b) => a.service.localeCompare(b.service, undefined, { numeric: true }));

    const updatedAt = new Date(now).toISOString();

    const result: BusApiResponse = {
      etas,
      updatedAt,
      note: payload.Message,
    };

    if (etas.length === 0) {
      result.note = payload.Message ?? "No upcoming buses reported at this stop.";
    }

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch bus arrivals", error);
    return Response.json({ error: "Failed to fetch bus arrivals" }, { status: 500 });
  }
}

function normaliseArrival(entry: Partial<LtaBusTiming> | undefined, now: number): BusArrival | null {
  if (!entry?.EstimatedArrival) {
    return null;
  }

  const etaTimestamp = Date.parse(entry.EstimatedArrival);
  if (!Number.isFinite(etaTimestamp)) {
    return null;
  }

  const diffMinutes = Math.max(0, Math.floor((etaTimestamp - now) / 60000));

  return {
    etaMin: diffMinutes,
    load: entry.Load as BusArrival["load"],
  };
}

async function getServicesForStop(stop: string, headers: Record<string, string>) {
  const cached = busRoutesCache.get(stop);
  const now = Date.now();
  if (cached && now - cached.timestamp < BUS_ROUTES_CACHE_MS) {
    return cached.services;
  }

  try {
    const services = await fetchBusRoutesForStop(stop, headers);
    busRoutesCache.set(stop, { timestamp: now, services });
    return services;
  } catch (error) {
    console.error("BusRoutes lookup failed", stop, error);
    return [];
  }
}

async function fetchBusRoutesForStop(stop: string, headers: Record<string, string>) {
  const services = new Set<string>();
  let skip = 0;

  while (true) {
    const url = new URL(BUS_ROUTES_ENDPOINT);
    url.searchParams.set("$skip", String(skip));
    url.searchParams.set("$filter", `BusStopCode eq '${stop}'`);

    const response = await fetch(url, {
      headers,
      next: { revalidate: Math.floor(BUS_ROUTES_CACHE_MS / 1000) },
    });

    if (!response.ok) {
      throw new Error(`BusRoutes API ${response.status}`);
    }

    const payload = (await response.json()) as BusRoutesResponse;
    const records = payload.value ?? [];
    if (!records.length) {
      break;
    }

    for (const record of records) {
      if (record.BusStopCode === stop) {
        services.add(record.ServiceNo);
      }
    }

    if (!payload["@odata.nextLink"] || records.length < BUS_ROUTES_PAGE_SIZE) {
      break;
    }

    skip += records.length;
  }

  return Array.from(services).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
