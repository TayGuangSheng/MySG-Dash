const SG_TIMEZONE = "Asia/Singapore";

export function formatSingaporeTime(iso: string, locale = "en-SG") {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SG_TIMEZONE,
  }).format(date);
}

export function formatRelativeMinutes(minutes: number | null) {
  if (minutes === null || Number.isNaN(minutes)) {
    return "--";
  }
  if (minutes <= 0) {
    return "now";
  }
  return `${minutes} min`;
}

export function formatNumber(
  value: number | null | undefined,
  locale = "en-SG",
  options?: Intl.NumberFormatOptions,
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return new Intl.NumberFormat(locale, options).format(value);
}

export function emphasiseForecast(forecast: string | null | undefined) {
  if (!forecast) return "Weather";
  return forecast.charAt(0).toUpperCase() + forecast.slice(1);
}
