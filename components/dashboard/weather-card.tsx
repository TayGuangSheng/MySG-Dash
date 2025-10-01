"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useWeatherLocation } from "@/contexts/weather-location-context";
import { useWeather } from "@/hooks/use-weather";
import { emphasiseForecast, formatNumber, formatRelativeMinutes, formatSingaporeTime } from "@/lib/format";
import type { WeatherApiResponse } from "@/types/api";

const METRIC_LABEL_CLASS = "text-[clamp(10px,1.2vw,14px)] uppercase tracking-[0.3em] text-white/55";
const METRIC_VALUE_CLASS = "text-[clamp(16px,2.5vw,36px)] font-semibold text-white";

const capitaliseWords = (value?: string | null) => value ? value.replace(/\b\w/g, (match) => match.toUpperCase()) : (value ?? "");
export default function WeatherCard() {
  const { selection } = useWeatherLocation();
  const { weather, isLoading, error } = useWeather(selection);

  const headline = useMemo(() => {
    const forecast = emphasiseForecast(weather?.representative?.forecast);
    return `${forecast}`;
  }, [weather?.representative?.forecast]);

  const emoji = useMemo(
    () => weatherHeadlineEmoji(weather?.representative?.forecast, weather?.anyRain),
    [weather?.representative?.forecast, weather?.anyRain],
  );

  return (
    <Card className="flex flex-col gap-[clamp(16px,1.4vw,20px)] p-[clamp(16px,1.8vw,24px)]">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-[clamp(16px,1.6vw,24px)] text-balance">
        <div className="flex min-w-0 flex-col gap-[clamp(6px,0.8vw,10px)]">
          <span className="truncate text-[clamp(16px,2.2vw,28px)] font-semibold leading-tight tracking-tight text-white">
            {emoji} {headline}
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-[clamp(8px,0.9vw,12px)] text-[clamp(12px,1.4vw,16px)] text-white/70">
            <span>Updated {weather?.updatedAt ? formatSingaporeTime(weather.updatedAt) : "--:--"}</span>
            <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden />
            <span className="truncate">{weather?.center.label ?? "--"}</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-end text-right text-[clamp(12px,1.4vw,16px)] text-white/60">
          {weather?.window ? (
            <>
              <span>Forecast window</span>
              <span>
                {formatRelativeMinutes(weather.window.minFromNow)} to {formatRelativeMinutes(weather.window.maxFromNow)}
              </span>
            </>
          ) : (
            <span>Forecast window pending</span>
          )}
        </div>
      </header>

      <section className="grid h-full min-h-0 grid-cols-1 gap-[clamp(10px,1vw,16px)] auto-rows-[minmax(90px,1fr)] sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="UV Index" value={formatNumber(weather?.uvIndex)} detail={uvDetail(weather?.uvIndex)} />
        <Metric
          label="Temperature"
          value={
            weather?.temperature
              ? `${formatNumber(weather.temperature.value, { maximumFractionDigits: 1 })}${weather.temperature.unit}`
              : "--"
          }
          detail={weather?.temperature?.station ?? "Nearest station"}
        />
        <Metric
          label="PSI"
          value={formatNumber(weather?.psi?.value)}
          detail={weather?.psi?.region ? `${capitaliseWords(weather.psi.region)} region` : "24h PSI"}
        />
        <Metric
          label="Rain"
          value={weather?.anyRain ? "Likely" : "Clear"}
          detail={rainDetail(weather)}
        />
      </section>

      <footer className="mt-auto space-y-[clamp(8px,1vw,12px)] text-[clamp(12px,1.4vw,16px)] text-white/70">
        {weather?.rainyAreas?.length ? (
          <p className="truncate">
            Rainy nearby: {weather.rainyAreas.slice(0, 3).map((area) => capitaliseWords(area.area)).join(", ")}
            {weather.rainyAreas.length > 3 ? "..." : ""}
          </p>
        ) : (
          <p>No rain detected in surrounding areas.</p>
        )}
        {(weather?.error || error) && <p className="text-amber-200/80">{weather?.error ?? error?.message}</p>}
        {isLoading && <p className="text-white/50">Refreshing weather data...</p>}
      </footer>
    </Card>
  );
}

type MetricProps = {
  label: string;
  value: string;
  detail?: string;
};

function Metric({ label, value, detail }: MetricProps) {
  return (
    <div className="grid min-h-0 grid-rows-[auto_auto_auto] gap-[clamp(2px,0.3vw,4px)] rounded-xl border border-white/12 bg-white/5 px-[clamp(6px,0.8vw,10px)] py-[clamp(4px,0.6vw,8px)]">
      {/* Location text (e.g. "Kim Chuan Road") */}
      <span className="text-[clamp(8px,0.9vw,12px)] text-white/60 truncate">{detail}</span>

      {/* Main value text (e.g. "central region") */}
      <span className="text-[clamp(14px,2.1vw,28px)] font-semibold text-white/85 truncate">{value}</span>

      {/* Label text (e.g. "PSI", "TEMPERATURE") */}
      <span className="text-[clamp(7px,0.8vw,10px)] uppercase tracking-[0.2em] text-white/50 truncate">
        {label}
      </span>
    </div>
  );
}

function uvDetail(value: number | null | undefined) {
  if (value === null || value === undefined) return "Awaiting index";
  if (value <= 2) return "Low";
  if (value <= 5) return "Moderate";
  if (value <= 7) return "High";
  if (value <= 10) return "Very high";
  return "Extreme";
}
function weatherHeadlineEmoji(forecast?: string | null, anyRain?: boolean) {
  const normalized = forecast?.toLowerCase().trim();
  if (!normalized || normalized.length === 0) {
    return anyRain ? "🌧️" : "❓";
  }

  const hasAll = (...terms: string[]) => terms.every((term) => normalized.includes(term));

  if (normalized.includes("thunder")) return "⛈️";
  if (normalized.includes("showers")) return "🌦️";
  if (normalized.includes("rain")) return "🌧️";
  if (hasAll("partly", "cloud")) return "🌤️";
  if (hasAll("mostly", "cloud")) return "☁️";
  if (normalized.includes("cloud")) return "☁️";
  if (normalized.includes("hazy") || normalized.includes("mist") || normalized.includes("smok")) return "🌫️";
  if (normalized.includes("wind")) return "💨";
  if (normalized.includes("fair") || normalized.includes("sun") || normalized.includes("clear")) return "☀️";

  return anyRain ? "🌧️" : "☀️";
}


function rainDetail(weather?: WeatherApiResponse | null) {
  if (!weather) return "Forecast pending";
  if (weather.anyRain) {
    return weather.rainyAreas.length ? `Watch ${capitaliseWords(weather.rainyAreas[0].area)}` : "Keep umbrella handy";
  }
  return "All clear";
}
