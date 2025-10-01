export type BusArrivalLoad = "SEA" | "SDA" | "LSD";

export type BusArrival = {
  service: string;
  arrivals: Array<{
    etaMin: number;
    load?: BusArrivalLoad;
  }>;
  status?: string;
};

export type BusApiResponse = {
  etas: BusArrival[];
  updatedAt: string;
  note?: string;
  error?: string;
};

export type TrainStatus = "Normal" | "Delay" | "Disrupted";

export type TrainApiResponse = {
  lines: Array<{
    line: "NSL" | "EWL" | "NEL" | "CCL" | "DTL" | "TEL";
    status: TrainStatus;
    note?: string;
  }>;
  updatedAt: string;
  error?: string;
};

export type WeatherApiResponse = {
  center: { label: string; lat: number; lon: number };
  updatedAt: string;
  window: {
    start: string;
    end: string;
    minFromNow: number | null;
    maxFromNow: number | null;
  } | null;
  anyRain: boolean;
  representative: { area: string; forecast: string } | null;
  rainyAreas: Array<{ area: string; forecast: string }>;
  uvIndex: number | null;
  temperature: { value: number; unit: string; station: string } | null;
  psi: { value: number; region: string } | null;
  error?: string;
};
