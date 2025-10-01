import { NextRequest } from "next/server";
import { findNearest } from "@/lib/geo";
import { resolveLocation, type WeatherLocationSelection } from "@/lib/locations";

const DATA_GOV_BASE = "https://api.data.gov.sg/v1";
const DEFAULT_REVALIDATE_SECONDS = 300;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const resolved = resolveQueryLocation(searchParams);

  const headers = buildDataGovHeaders();

  const errors: string[] = [];

  const [forecast, uv, temperature, psi, rainfall] = await Promise.all([
    fetchTwoHourForecast(headers).catch((error) => {
      errors.push(messageForError("2-hour forecast", error));
      return null;
    }),
    fetchUvIndex(headers).catch((error) => {
      errors.push(messageForError("UV index", error));
      return null;
    }),
    fetchAirTemperature(headers).catch((error) => {
      errors.push(messageForError("air temperature", error));
      return null;
    }),
    fetchPsi(headers).catch((error) => {
      errors.push(messageForError("PSI", error));
      return null;
    }),
    fetchRainfall(headers).catch((error) => {
      errors.push(messageForError("rainfall", error));
      return null;
    }),
  ]);

  const forecastItem = forecast?.items?.[0];
  const validPeriod = forecastItem?.valid_period;

  const representative = forecast && pickForecastForLocation(forecast, resolved);
  const rainyAreas = forecastItem?.forecasts?.filter((item: { forecast: string }) =>
    /rain|showers|thundery/i.test(item.forecast),
  );

  const temperatureReading = temperature && pickTemperatureForLocation(temperature, resolved);
  const psiReading = psi && pickPsiForLocation(psi, resolved);
  const uvValue = uv?.items?.[0]?.index?.slice(-1)[0]?.value ?? null;

  const anyRain = Boolean(
    rainyAreas?.length || rainfall?.items?.[0]?.readings?.some((reading) => reading.value > 0),
  );

  const updatedAt =
    forecastItem?.update_timestamp ??
    uv?.items?.[0]?.timestamp ??
    temperature?.items?.[0]?.timestamp ??
    new Date().toISOString();

  const response = {
    center: {
      label: resolvedLabel(resolved),
      lat: resolvedLat(resolved),
      lon: resolvedLon(resolved),
    },
    updatedAt,
    window: validPeriod
      ? {
          start: validPeriod.start,
          end: validPeriod.end,
          minFromNow: minutesFromNow(validPeriod.start),
          maxFromNow: minutesFromNow(validPeriod.end),
        }
      : null,
    anyRain,
    representative: representative
      ? { area: representative.area, forecast: representative.forecast }
      : null,
    rainyAreas: rainyAreas?.map((item: { area: string; forecast: string }) => ({
      area: item.area,
      forecast: item.forecast,
    })) ?? [],
    uvIndex: uvValue,
    temperature: temperatureReading
      ? {
          value: Number(temperatureReading.value),
          unit: "\u00b0C",
          station: temperatureReading.station,
        }
      : null,
    psi: psiReading
      ? {
          value: psiReading.value,
          region: psiReading.region,
        }
      : null,
    error: errors.length ? errors.join(" | ") : undefined,
  };

  return Response.json(response);
}

type SearchParams = URLSearchParams;

type ForecastResponse = {
  items: Array<{
    update_timestamp: string;
    valid_period: { start: string; end: string };
    forecasts: Array<{ area: string; forecast: string }>;
  }>;
  area_metadata: Array<{ name: string; label_location: { latitude: number; longitude: number } }>;
};

type TemperatureResponse = {
  metadata: { stations: Array<{ id: string; name: string; location: { latitude: number; longitude: number } }> };
  items: Array<{ timestamp: string; readings: Array<{ station_id: string; value: number }> }>;
};

type PsiResponse = {
  region_metadata: Array<{ name: string; label_location: { latitude: number; longitude: number } }>;
  items: Array<{
    timestamp: string;
    readings: {
      psi_twenty_four_hourly: Record<string, number>;
    };
  }>;
};

type RainfallResponse = {
  items: Array<{
    timestamp: string;
    readings: Array<{ station_id: string; value: number }>;
  }>;
};

type UvResponse = {
  items: Array<{
    timestamp: string;
    index: Array<{ timestamp: string; value: number }>;
  }>;
};

function resolveQueryLocation(searchParams: SearchParams): WeatherLocationSelection {
  const near = searchParams.get("near");
  if (near) {
    return resolveLocation(near);
  }

  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (lat && lon) {
    const parsedLat = Number(lat);
    const parsedLon = Number(lon);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLon)) {
      return {
        type: "gps",
        lat: parsedLat,
        lon: parsedLon,
        label: `GPS (${parsedLat.toFixed(3)}, ${parsedLon.toFixed(3)})`,
      };
    }
  }

  return resolveLocation(null);
}

function buildDataGovHeaders() {
  const headers: Record<string, string> = {
    accept: "application/json",
  };

  const apiKey = process.env.DATA_GOV_SG_API_KEY;
  if (apiKey) {
    headers["api-key"] = apiKey;
  }

  return headers;
}

async function fetchTwoHourForecast(headers: Record<string, string>) {
  const response = await fetch(`${DATA_GOV_BASE}/environment/2-hour-weather-forecast`, {
    headers,
    next: { revalidate: DEFAULT_REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`Forecast API ${response.status}`);
  }
  return (await response.json()) as ForecastResponse;
}

async function fetchUvIndex(headers: Record<string, string>) {
  const response = await fetch(`${DATA_GOV_BASE}/environment/uv-index`, {
    headers,
    next: { revalidate: 600 },
  });
  if (!response.ok) {
    throw new Error(`UV API ${response.status}`);
  }
  return (await response.json()) as UvResponse;
}

async function fetchAirTemperature(headers: Record<string, string>) {
  const response = await fetch(`${DATA_GOV_BASE}/environment/air-temperature`, {
    headers,
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error(`Temperature API ${response.status}`);
  }
  return (await response.json()) as TemperatureResponse;
}

async function fetchPsi(headers: Record<string, string>) {
  const response = await fetch(`${DATA_GOV_BASE}/environment/psi`, {
    headers,
    next: { revalidate: 600 },
  });
  if (!response.ok) {
    throw new Error(`PSI API ${response.status}`);
  }
  return (await response.json()) as PsiResponse;
}

async function fetchRainfall(headers: Record<string, string>) {
  const response = await fetch(`${DATA_GOV_BASE}/environment/rainfall`, {
    headers,
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error(`Rainfall API ${response.status}`);
  }
  return (await response.json()) as RainfallResponse;
}

function pickForecastForLocation(forecast: ForecastResponse, selection: WeatherLocationSelection) {
  const lat = resolvedLat(selection);
  const lon = resolvedLon(selection);
  const nearestMeta = findNearest(
    forecast.area_metadata.map((item) => ({
      name: item.name,
      lat: item.label_location.latitude,
      lon: item.label_location.longitude,
    })),
    lat,
    lon,
  );

  if (!nearestMeta) return null;

  return (
    forecast.items?.[0]?.forecasts?.find((forecastItem) => forecastItem.area === nearestMeta.name) ?? null
  );
}

function pickTemperatureForLocation(temperature: TemperatureResponse, selection: WeatherLocationSelection) {
  const lat = resolvedLat(selection);
  const lon = resolvedLon(selection);
  const station = findNearest(
    temperature.metadata.stations.map((station) => ({
      id: station.id,
      name: station.name,
      lat: station.location.latitude,
      lon: station.location.longitude,
    })),
    lat,
    lon,
  );
  if (!station) return null;

  const readings = temperature.items?.[0]?.readings ?? [];
  const reading = readings.find((item) => item.station_id === station.id);
  if (!reading) return null;

  return { station: station.name, value: reading.value };
}

function pickPsiForLocation(psi: PsiResponse, selection: WeatherLocationSelection) {
  const lat = resolvedLat(selection);
  const lon = resolvedLon(selection);
  const region = findNearest(
    psi.region_metadata.map((region) => ({
      name: region.name,
      lat: region.label_location.latitude,
      lon: region.label_location.longitude,
    })),
    lat,
    lon,
  );
  if (!region) return null;

  const readings = psi.items?.[0]?.readings?.psi_twenty_four_hourly ?? {};
  const key = region.name.toLowerCase();
  const value = readings[key] ?? readings[region.name] ?? null;
  if (value === null || value === undefined) {
    return null;
  }

  return { region: region.name, value };
}

function resolvedLat(selection: WeatherLocationSelection) {
  return selection.type === "preset" ? selection.location.lat : selection.lat;
}

function resolvedLon(selection: WeatherLocationSelection) {
  return selection.type === "preset" ? selection.location.lon : selection.lon;
}

function resolvedLabel(selection: WeatherLocationSelection) {
  if (selection.type === "preset") {
    return selection.location.label;
  }
  return selection.label;
}

function minutesFromNow(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return Math.round((timestamp - Date.now()) / 60000);
}

function messageForError(resource: string, error: unknown) {
  if (error instanceof Error) {
    return `${resource}: ${error.message}`;
  }
  return `${resource}: ${String(error)}`;
}