"use client";

import { useMemo } from "react";
import { useTranslation, type Translator } from "@/contexts/language-context";
import { Card } from "@/components/ui/card";
import { useWeatherLocation } from "@/contexts/weather-location-context";
import { useWeather } from "@/hooks/use-weather";
import { emphasiseForecast, formatNumber, formatSingaporeTime } from "@/lib/format";
import type { WeatherApiResponse } from "@/types/api";
import type { TranslationKey } from "@/locales";

const capitaliseWords = (value?: string | null) =>
  value ? value.replace(/\b\w/g, (match) => match.toUpperCase()) : value ?? "";

const FORECAST_TRANSLATION_KEYS = {
  default: "dashboard.weatherCard.forecasts.default",
  "partly-cloudy-day": "dashboard.weatherCard.forecasts.partlyCloudyDay",
  "partly-cloudy-night": "dashboard.weatherCard.forecasts.partlyCloudyNight",
  "partly-cloudy": "dashboard.weatherCard.forecasts.partlyCloudy",
  "mostly-cloudy": "dashboard.weatherCard.forecasts.mostlyCloudy",
  cloudy: "dashboard.weatherCard.forecasts.cloudy",
  overcast: "dashboard.weatherCard.forecasts.overcast",
  "fair-day": "dashboard.weatherCard.forecasts.fairDay",
  "fair-night": "dashboard.weatherCard.forecasts.fairNight",
  fair: "dashboard.weatherCard.forecasts.fair",
  "fair-and-warm": "dashboard.weatherCard.forecasts.fairAndWarm",
  sunny: "dashboard.weatherCard.forecasts.sunny",
  "sunny-intervals": "dashboard.weatherCard.forecasts.sunnyIntervals",
  "light-showers": "dashboard.weatherCard.forecasts.lightShowers",
  "passing-showers": "dashboard.weatherCard.forecasts.passingShowers",
  showers: "dashboard.weatherCard.forecasts.showers",
  "heavy-showers": "dashboard.weatherCard.forecasts.heavyShowers",
  "thundery-showers": "dashboard.weatherCard.forecasts.thunderyShowers",
  "thundery-showers-with-gusty-winds": "dashboard.weatherCard.forecasts.thunderyShowersWithGustyWinds",
  "heavy-thundery-showers": "dashboard.weatherCard.forecasts.heavyThunderyShowers",
  "heavy-thundery-showers-with-gusty-winds": "dashboard.weatherCard.forecasts.heavyThunderyShowersWithGustyWinds",
  drizzle: "dashboard.weatherCard.forecasts.drizzle",
  "light-rain": "dashboard.weatherCard.forecasts.lightRain",
  rain: "dashboard.weatherCard.forecasts.rain",
  "heavy-rain": "dashboard.weatherCard.forecasts.heavyRain",
  windy: "dashboard.weatherCard.forecasts.windy",
  "windy-with-showers": "dashboard.weatherCard.forecasts.windyAndShowers",
  "windy-with-rain": "dashboard.weatherCard.forecasts.windyAndRain",
  "windy-and-fair": "dashboard.weatherCard.forecasts.windyAndFair",
  breezy: "dashboard.weatherCard.forecasts.breezy",
  "strong-winds": "dashboard.weatherCard.forecasts.strongWinds",
  hazy: "dashboard.weatherCard.forecasts.hazy",
  mist: "dashboard.weatherCard.forecasts.mist",
  fog: "dashboard.weatherCard.forecasts.fog",
} as const satisfies Record<string, TranslationKey>;

type ForecastKey = keyof typeof FORECAST_TRANSLATION_KEYS;

export default function WeatherCard() {
  const { selection } = useWeatherLocation();
  const { weather, isLoading, error } = useWeather(selection);
  const { t, locale } = useTranslation();

  const headline = useMemo(
    () => translateForecast(weather?.representative?.forecast, t),
    [weather?.representative?.forecast, t],
  );

  const emoji = useMemo(
    () => weatherHeadlineEmoji(weather?.representative?.forecast, weather?.anyRain),
    [weather?.representative?.forecast, weather?.anyRain],
  );

  const formatRelative = (minutes: number | null) => {
    if (minutes === null || Number.isNaN(minutes)) {
      return t("common.time.unknown");
    }
    if (minutes <= 0) {
      return t("common.time.now");
    }
    return t("common.time.minutes", { value: minutes });
  };

  const updatedLabel = weather?.updatedAt ? formatSingaporeTime(weather.updatedAt, locale) : "--:--";

  return (
    <Card className="flex flex-col gap-[clamp(16px,1.4vw,20px)] p-[clamp(16px,1.8vw,24px)]">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-[clamp(16px,1.6vw,24px)] text-balance">
        <div className="flex min-w-0 flex-col gap-[clamp(6px,0.8vw,10px)]">
          <span className="truncate text-[clamp(16px,2.2vw,28px)] font-semibold leading-tight tracking-tight text-white">
            {emoji} {headline}
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-[clamp(8px,0.9vw,12px)] text-[clamp(12px,1.4vw,16px)] text-white/70">
            <span>{t("dashboard.weatherCard.updated", { time: updatedLabel })}</span>
            <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden />
            <span className="truncate">{weather?.center.label ?? "--"}</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-end text-right text-[clamp(12px,1.4vw,16px)] text-white/60">
          {weather?.window ? (
            <>
              <span>{t("dashboard.weatherCard.windowTitle")}</span>
              <span>
                {t("dashboard.weatherCard.windowRange", {
                  start: formatRelative(weather.window.minFromNow),
                  end: formatRelative(weather.window.maxFromNow),
                })}
              </span>
            </>
          ) : (
            <span>{t("dashboard.weatherCard.windowPending")}</span>
          )}
        </div>
      </header>

      <section className="grid h-full min-h-0 grid-cols-1 gap-[clamp(10px,1vw,16px)] auto-rows-[minmax(90px,1fr)] sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={t("dashboard.weatherCard.metrics.uvIndex")}
          value={formatNumber(weather?.uvIndex, locale)}
          detail={uvDetail(weather?.uvIndex, t)}
        />
        <Metric
          label={t("dashboard.weatherCard.metrics.temperature")}
          value={
            weather?.temperature
              ? `${formatNumber(weather.temperature.value, locale, { maximumFractionDigits: 1 })}${weather.temperature.unit}`
              : "--"
          }
          detail={weather?.temperature?.station ?? t("dashboard.weatherCard.metrics.nearestStation")}
        />
        <Metric
          label={t("dashboard.weatherCard.metrics.psi")}
          value={formatNumber(weather?.psi?.value, locale)}
          detail={
            weather?.psi?.region
              ? t("dashboard.weatherCard.metrics.region", { region: capitaliseWords(weather.psi.region) })
              : t("dashboard.weatherCard.metrics.fallbackDetail")
          }
        />
        <Metric
          label={t("dashboard.weatherCard.metrics.rain")}
          value={weather?.anyRain ? t("dashboard.weatherCard.metrics.rainLikely") : t("dashboard.weatherCard.metrics.rainClear")}
          detail={rainDetail(weather, t)}
        />
      </section>

      <footer className="mt-auto space-y-[clamp(8px,1vw,12px)] text-[clamp(12px,1.4vw,16px)] text-white/70">
        {weather?.rainyAreas?.length ? (
          <p className="truncate">
            {t("dashboard.weatherCard.rainyAreas", {
              areas: weather.rainyAreas.slice(0, 3).map((area) => capitaliseWords(area.area)).join(", "),
            })}
            {weather.rainyAreas.length > 3 ? "..." : ""}
          </p>
        ) : (
          <p>{t("dashboard.weatherCard.noRain")}</p>
        )}
        {(weather?.error || error) && <p className="text-amber-200/80">{weather?.error ?? error?.message}</p>}
        {isLoading && <p className="text-white/50">{t("dashboard.weatherCard.refreshing")}</p>}
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
      <span className="text-[clamp(8px,0.9vw,12px)] text-white/60 truncate">{detail}</span>
      <span className="text-[clamp(14px,2.1vw,28px)] font-semibold text-white/85 truncate">{value}</span>
      <span className="text-[clamp(7px,0.8vw,10px)] uppercase tracking-[0.2em] text-white/50 truncate">{label}</span>
    </div>
  );
}

function uvDetail(value: number | null | undefined, t: Translator) {
  if (value === null || value === undefined) return t("dashboard.weatherCard.uvLevels.awaiting");
  if (value <= 2) return t("dashboard.weatherCard.uvLevels.low");
  if (value <= 5) return t("dashboard.weatherCard.uvLevels.moderate");
  if (value <= 7) return t("dashboard.weatherCard.uvLevels.high");
  if (value <= 10) return t("dashboard.weatherCard.uvLevels.veryHigh");
  return t("dashboard.weatherCard.uvLevels.extreme");
}

function weatherHeadlineEmoji(forecast?: string | null, anyRain?: boolean) {
  const normalized = forecast?.toLowerCase().trim();
  if (!normalized || normalized.length === 0) {
    return anyRain ? "\u{1F327}" : "\u{2600}";
  }

  const hasAll = (...terms: string[]) => terms.every((term) => normalized.includes(term));

  if (normalized.includes("thunder")) return "\u{26C8}";
  if (normalized.includes("showers")) return "\u{1F326}";
  if (normalized.includes("rain")) return "\u{1F327}";
  if (hasAll("partly", "cloud")) return "\u{26C5}";
  if (hasAll("mostly", "cloud")) return "\u{2601}";
  if (normalized.includes("cloud")) return "\u{2601}";
  if (normalized.includes("hazy") || normalized.includes("mist") || normalized.includes("smok")) return "\u{1F32B}";
  if (normalized.includes("wind")) return "\u{1F343}";
  if (normalized.includes("fair") || normalized.includes("sun") || normalized.includes("clear")) return "\u{2600}";

  return anyRain ? "\u{1F327}" : "\u{2600}";
}

function rainDetail(weather: WeatherApiResponse | null | undefined, t: Translator) {
  if (!weather) return t("dashboard.weatherCard.rainDetails.pending");
  if (weather.anyRain) {
    return weather.rainyAreas.length
      ? t("dashboard.weatherCard.rainDetails.watchArea", {
          area: capitaliseWords(weather.rainyAreas[0].area),
        })
      : t("dashboard.weatherCard.rainDetails.keepUmbrella");
  }
  return t("dashboard.weatherCard.rainDetails.allClear");
}

function slugifyForecast(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isForecastKey(value: string): value is ForecastKey {
  return value in FORECAST_TRANSLATION_KEYS;
}

function translateForecast(forecast: string | null | undefined, t: Translator) {
  if (!forecast) {
    return t(FORECAST_TRANSLATION_KEYS.default);
  }

  let slug = slugifyForecast(forecast);
  let key = isForecastKey(slug) ? FORECAST_TRANSLATION_KEYS[slug] : undefined;

  while (!key && slug.includes("-")) {
    slug = slug.replace(/-[^-]+$/, "");
    if (isForecastKey(slug)) {
      key = FORECAST_TRANSLATION_KEYS[slug];
    }
  }

  if (key) {
    return t(key);
  }

  return emphasiseForecast(forecast);
}
