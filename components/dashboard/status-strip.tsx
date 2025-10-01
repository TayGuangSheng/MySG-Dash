"use client";

import { useTranslation, type Translator } from "@/contexts/language-context";
import { useWeatherLocation } from "@/contexts/weather-location-context";
import { useWeather } from "@/hooks/use-weather";
import { useTrainStatus } from "@/hooks/use-train-status";
import { useBusArrivals } from "@/hooks/use-bus-arrivals";
import { formatSingaporeTime } from "@/lib/format";
import type { BusApiResponse } from "@/types/api";

export type StatusStripProps = {
  busStops: readonly [
    { id: string; label: string },
    { id: string; label: string },
  ];
};

function StatusStrip({ busStops }: StatusStripProps) {
  const { selection } = useWeatherLocation();
  const weather = useWeather(selection).weather;
  const trains = useTrainStatus().status;
  const { t, locale } = useTranslation();

  const [firstStop, secondStop] = busStops;
  const firstBus = useBusArrivals(firstStop.id).arrivals;
  const secondBus = useBusArrivals(secondStop.id).arrivals;

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-center gap-[clamp(12px,1.1vw,18px)] rounded-full bg-white/10 px-[clamp(20px,1.8vw,32px)] py-[clamp(8px,0.9vw,12px)] text-[clamp(12px,1.4vw,16px)] text-white/85 backdrop-blur">
      <StatusItem
        label={t("dashboard.statusStrip.weatherLabel")}
        value={weather?.updatedAt ? formatSingaporeTime(weather.updatedAt, locale) : "--:--"}
      />
      <Dot />
      <StatusItem
        label={t("dashboard.statusStrip.mrtLabel")}
        value={trains?.updatedAt ? formatSingaporeTime(trains.updatedAt, locale) : "--:--"}
      />
      <Dot />
      <StatusItem
        label={t("dashboard.statusStrip.busLabel", { label: firstStop.label })}
        value={formatBusSummary(firstBus, t)}
      />
      <Dot />
      <StatusItem
        label={t("dashboard.statusStrip.busLabel", { label: secondStop.label })}
        value={formatBusSummary(secondBus, t)}
      />
    </div>
  );
}

type StatusItemProps = {
  label: string;
  value: string;
};

function StatusItem({ label, value }: StatusItemProps) {
  return (
    <span className="flex min-w-0 items-center gap-[clamp(6px,0.8vw,10px)] whitespace-nowrap">
      <span className="text-[clamp(12px,1.3vw,15px)] uppercase tracking-[0.3em] text-white/60">{label}</span>
      <span className="text-[clamp(12px,1.4vw,16px)] font-semibold text-white">{value}</span>
    </span>
  );
}

function Dot() {
  return <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden />;
}

function formatBusSummary(bus: BusApiResponse | undefined, t: Translator) {
  const eta = bus?.etas?.[0]?.arrivals?.[0]?.etaMin;
  if (eta === undefined || eta === null) {
    return bus?.note ? bus.note : "--";
  }
  if (eta <= 0) return t("dashboard.statusStrip.arrivedShort");
  return `${eta}${t("dashboard.busCard.minuteSuffix")}`;
}

export default StatusStrip;


