import { NextRequest } from "next/server";

type TrainStatus = "Normal" | "Delay" | "Disrupted";

type LtaTrainEntry = {
  Line: string;
  Status: string;
  Message?: string;
};

type LtaTrainAggregate = {
  Status?: number | string;
  AffectedSegments?: unknown;
  Message?: Array<unknown> | Record<string, unknown> | string;
};

type LtaTrainResponse = {
  value: LtaTrainEntry[] | LtaTrainAggregate;
};

type TrainLineStatus = {
  line: "NSL" | "EWL" | "NEL" | "CCL" | "DTL" | "TEL";
  status: TrainStatus;
  note?: string;
};

type TrainApiResponse = {
  lines: TrainLineStatus[];
  updatedAt: string;
};

const KNOWN_LINES = ["NSL", "EWL", "NEL", "CCL", "DTL", "TEL"] as const;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lineParam = searchParams.get("line");

  const requested = (lineParam?.split("|") ?? KNOWN_LINES).filter((entry): entry is TrainLineStatus["line"] =>
    KNOWN_LINES.includes(entry as TrainLineStatus["line"]),
  );

  const accountKey = process.env.LTA_ACCOUNT_KEY;
  if (!accountKey) {
    return Response.json(
      { error: "LTA_ACCOUNT_KEY environment variable is not configured." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch("https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts", {
      headers: {
        accept: "application/json",
        AccountKey: accountKey,
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Train API error", response.status, text);
      return Response.json(
        { error: `TrainServiceAlerts responded with status ${response.status}` },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as LtaTrainResponse;
    const rawValue = payload.value;

    const lines = Array.isArray(rawValue)
      ? mapEntries(rawValue, requested)
      : deriveFromAggregate(rawValue, requested);

    const updatedAt = new Date().toISOString();
    const result: TrainApiResponse = { lines, updatedAt };

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch train statuses", error);
    return Response.json({ error: "Failed to fetch train statuses" }, { status: 500 });
  }
}

function mapEntries(entries: LtaTrainEntry[], requested: readonly TrainLineStatus["line"][]): TrainLineStatus[] {
  const byLine = new Map<string, { Status: string; Message?: string }>();
  entries.forEach((entry) => {
    byLine.set(entry.Line.toUpperCase(), { Status: entry.Status, Message: entry.Message });
  });

  return requested.map((line) => {
    const raw = byLine.get(line) ?? { Status: "Normal" };
    const status = normaliseStatus(raw.Status);
    return {
      line,
      status,
      note: raw.Message,
    };
  });
}

function deriveFromAggregate(
  aggregate: LtaTrainAggregate | undefined,
  requested: readonly TrainLineStatus["line"][],
): TrainLineStatus[] {
  const status = statusFromAggregate(aggregate?.Status);
  const segments = Array.isArray(aggregate?.AffectedSegments)
    ? (aggregate?.AffectedSegments as Array<Record<string, unknown>>)
    : [];
  const affected = extractAffectedLines(segments);
  const messages = extractMessages(aggregate?.Message);
  const note = messages.length ? messages.join(" ? ") : undefined;

  return requested.map((line) => {
    const isAffected = affected.size === 0 ? status !== "Normal" : affected.has(line);
    return {
      line,
      status: isAffected ? status : "Normal",
      note: isAffected ? note : undefined,
    };
  });
}

function extractAffectedLines(segments: Array<Record<string, unknown>>): Set<TrainLineStatus["line"]> {
  const result = new Set<TrainLineStatus["line"]>();
  segments.forEach((segment) => {
    const candidates = [
      segment["Line"],
      segment["line"],
      segment["LINE"],
      segment["LineName"],
      segment["Line_code"],
      segment["ServiceType"],
      segment["Route"],
    ];
    for (const value of candidates) {
      if (typeof value === "string") {
        const code = value.trim().toUpperCase();
        if (KNOWN_LINES.includes(code as TrainLineStatus["line"])) {
          result.add(code as TrainLineStatus["line"]);
          break;
        }
      }
    }
  });
  return result;
}

function extractMessages(input: LtaTrainAggregate["Message"]): string[] {
  if (!input) return [];

  const ensureArray = Array.isArray(input) ? input : [input];
  const messages = ensureArray
    .map((entry) => summariseMessage(entry))
    .filter((value): value is string => Boolean(value));

  return [...new Set(messages.map((message) => message.trim()))];
}

function summariseMessage(entry: unknown): string | null {
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  if (typeof entry === "object") {
    const record = entry as Record<string, unknown>;
    const keys = [
      "Content",
      "Message",
      "Summary",
      "Description",
      "AdditionalInformation",
      "AdditionalInfo",
      "Text",
    ];
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }
  return null;
}

function statusFromAggregate(value: number | string | undefined): TrainStatus {
  if (typeof value === "number") {
    if (value <= 1) return "Normal";
    if (value === 2) return "Delay";
    return "Disrupted";
  }
  if (typeof value === "string") {
    return normaliseStatus(value);
  }
  return "Normal";
}

function normaliseStatus(input: string): TrainStatus {
  const normalised = input.toLowerCase();
  if (normalised.includes("delay")) {
    return "Delay";
  }
  if (normalised.includes("disrupt")) {
    return "Disrupted";
  }
  return "Normal";
}