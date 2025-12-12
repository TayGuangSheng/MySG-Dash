"use client";

import { useEffect, useMemo, useState, useCallback, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/contexts/language-context";
import { useWeatherLocation } from "@/contexts/weather-location-context";
import { useWeather } from "@/hooks/use-weather";
import type { TranslationKey } from "@/locales";

type TimerStatus = "idle" | "running" | "paused" | "done";

const PRESETS = [
  { code: "SIN", label: "Singapore (SIN)" },
  { code: "KUL", label: "Kuala Lumpur (KUL)" },
  { code: "BKK", label: "Bangkok (BKK)" },
  { code: "HKT", label: "Phuket (HKT)" },
  { code: "CGK", label: "Jakarta (CGK)" },
  { code: "DPS", label: "Bali (DPS)" },
  { code: "MNL", label: "Manila (MNL)" },
  { code: "HKG", label: "Hong Kong (HKG)" },
  { code: "TPE", label: "Taipei (TPE)" },
  { code: "NRT", label: "Tokyo (NRT)" },
  { code: "SYD", label: "Sydney (SYD)" },
  { code: "MEL", label: "Melbourne (MEL)" },
  { code: "PER", label: "Perth (PER)" },
  { code: "DEL", label: "Delhi (DEL)" },
  { code: "BOM", label: "Mumbai (BOM)" },
  { code: "LHR", label: "London (LHR)" },
  { code: "SFO", label: "San Francisco (SFO)" },
] as const;

const FLIGHT_DURATION_MIN: Record<string, number> = {
  "SIN-KUL": 65,
  "SIN-BKK": 140,
  "SIN-HKT": 120,
  "SIN-CGK": 105,
  "SIN-DPS": 150,
  "SIN-MNL": 205,
  "SIN-HKG": 220,
  "SIN-TPE": 275,
  "SIN-NRT": 420,
  "SIN-SYD": 480,
  "SIN-MEL": 460,
  "SIN-PER": 310,
  "SIN-DEL": 330,
  "SIN-BOM": 330,
  "SIN-LHR": 810,
  "SIN-SFO": 940,
  // reverse directions (approx same)
  "KUL-SIN": 65,
  "BKK-SIN": 140,
  "HKT-SIN": 120,
  "CGK-SIN": 105,
  "DPS-SIN": 150,
  "MNL-SIN": 205,
  "HKG-SIN": 220,
  "TPE-SIN": 275,
  "NRT-SIN": 420,
  "SYD-SIN": 480,
  "MEL-SIN": 460,
  "PER-SIN": 310,
  "DEL-SIN": 330,
  "BOM-SIN": 330,
  "LHR-SIN": 810,
  "SFO-SIN": 940,
};

const AIRPORT_TIMEZONE: Record<string, string> = {
  SIN: "Asia/Singapore",
  KUL: "Asia/Kuala_Lumpur",
  BKK: "Asia/Bangkok",
  HKT: "Asia/Bangkok",
  CGK: "Asia/Jakarta",
  DPS: "Asia/Makassar",
  MNL: "Asia/Manila",
  HKG: "Asia/Hong_Kong",
  TPE: "Asia/Taipei",
  NRT: "Asia/Tokyo",
  SYD: "Australia/Sydney",
  MEL: "Australia/Melbourne",
  PER: "Australia/Perth",
  DEL: "Asia/Kolkata",
  BOM: "Asia/Kolkata",
  LHR: "Europe/London",
  SFO: "America/Los_Angeles",
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function FocusCard() {
  const { t } = useTranslation();
  const { selection } = useWeatherLocation();
  const { weather } = useWeather(selection);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState<string>("SIN");
  const [destination, setDestination] = useState<string>("KUL");
  const [selectedMinutes, setSelectedMinutes] = useState<number>(FLIGHT_DURATION_MIN["SIN-KUL"] ?? 20);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(selectedMinutes * 60);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [endTime, setEndTime] = useState<number | null>(null);

  const tf = useCallback(
    (key: TranslationKey, fallback: string) => {
      const value = t(key);
      return value === key ? fallback : value;
    },
    [t],
  );

  const totalSeconds = useMemo(() => Math.max(selectedMinutes * 60, 1), [selectedMinutes]);
  const progress = Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status !== "running" || endTime === null) return undefined;

    const tick = () => {
      const next = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next <= 0) {
        setStatus("done");
        setEndTime(null);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [status, endTime]);

  useEffect(() => {
    if (status === "idle" || status === "done") {
      setRemainingSeconds(selectedMinutes * 60);
      setEndTime(null);
    }
  }, [selectedMinutes, status]);
  const flightDuration = useMemo(() => {
    const key = `${origin}-${destination}`;
    return FLIGHT_DURATION_MIN[key];
  }, [origin, destination]);

  useEffect(() => {
    if (flightDuration) {
      setSelectedMinutes(flightDuration);
      setRemainingSeconds(flightDuration * 60);
      setStatus("idle");
      setEndTime(null);
    }
  }, [flightDuration]);

  const handleStart = () => {
    setEndTime(Date.now() + remainingSeconds * 1000);
    setStatus("running");
  };

  const handlePause = () => {
    setStatus("paused");
    setEndTime(null);
  };

  const handleResume = () => {
    setEndTime(Date.now() + remainingSeconds * 1000);
    setStatus("running");
  };

  const handleReset = () => {
    setStatus("idle");
    setRemainingSeconds(selectedMinutes * 60);
    setEndTime(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const statusLabel = {
    idle: tf("dashboard.focusCard.status.preflight", "Pre-flight"),
    running: tf("dashboard.focusCard.status.enroute", "En route"),
    paused: tf("dashboard.focusCard.status.holding", "Holding"),
    done: tf("dashboard.focusCard.status.arrived", "Arrived"),
  }[status];
  const destinationOptions = useMemo(() => {
    if (origin === "SIN") {
      return PRESETS.filter((port) => port.code !== origin);
    }
    return PRESETS.filter((port) => port.code === "SIN");
  }, [origin]);

  useEffect(() => {
    if (origin === "SIN") return;
    if (destination !== "SIN") {
      setDestination("SIN");
    }
  }, [origin, destination]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (hrs) parts.push(`${hrs}h`);
    parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return parts.join(" ");
  };
  const formatLocalTime = (tz: string | undefined) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: tz ?? "UTC",
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short",
      }).format(new Date());
    } catch {
      return "--:--";
    }
  };

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="flex h-full min-h-[72px] w-full cursor-pointer flex-col justify-center gap-1.5 p-[clamp(12px,1vw,18px)] transition hover:shadow-[0_0_0_2px_rgba(255,255,255,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/80"
        aria-label={t("dashboard.focusCard.title")}
      >
        <span className="flex items-center gap-2 text-[clamp(16px,2vw,24px)] font-semibold text-white">
          <span aria-hidden="true">{"\u2708\uFE0F"}</span>
          {t("dashboard.focusCard.title")}
        </span>
        <span className="text-[clamp(11px,1.1vw,13px)] text-white/70">{statusLabel}</span>
      </Card>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="focus-dialog-title"
                className="relative flex h-[min(90vh,760px)] w-[min(100%,820px)] flex-col overflow-hidden rounded-3xl border border-white/15 bg-black/90 text-white shadow-2xl"
              >
                <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                  <div className="space-y-1">
                    <h2 id="focus-dialog-title" className="flex items-center gap-2 text-[clamp(1.2rem,1.6vw,1.8rem)] font-semibold">
                      <span aria-hidden="true">{"✈️"}</span>
                      {t("dashboard.focusCard.cockpitTitle")}
                    </h2>
                    <p className="text-[clamp(0.85rem,1vw,1.05rem)] text-white/70">
                      {t("dashboard.focusCard.subtitle")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/80 transition hover:border-white/60 hover:text-white"
                  >
                    {t("common.actions.close")}
                  </button>
                </header>

                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[clamp(11px,1.1vw,13px)] text-white/80">
                        {statusLabel}
                      </span>
                      {status === "done" ? (
                        <span className="text-[clamp(11px,1.1vw,13px)] text-[color:var(--highlight-color,#38bdf8)]">
                          {t("dashboard.focusCard.breakMessage")}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-end gap-3">
                      <span className="text-[clamp(32px,4vw,44px)] font-semibold leading-none text-white">
                        {formatTime(remainingSeconds)}
                      </span>
                      <span className="text-[clamp(12px,1.2vw,14px)] text-white/60">{t("dashboard.focusCard.subtitle")}</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-[color:var(--highlight-color,#38bdf8)] transition-[width]"
                        style={{ width: `${progress * 100}%` }}
                      />
                      <div
                        className="absolute -top-1.5 h-5 w-5 translate-x-[-50%] text-lg drop-shadow"
                        style={{ left: `${progress * 100}%` }}
                        aria-hidden="true"
                      >
                        {"\u2708\uFE0F"}
                      </div>
                    </div>
                  </div>

                  <section className="space-y-3">
                    <h3 className="text-[clamp(0.95rem,1.2vw,1.2rem)] font-semibold text-white/85">
                      {tf("dashboard.focusCard.routeLabel", "Flight path")}
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex flex-col gap-2 text-[clamp(12px,1.1vw,14px)] text-white/75">
                        <span>{tf("dashboard.focusCard.fromLabel", "Depart from")}</span>
                        <select
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                          className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
                          disabled={status === "running"}
                        >
                          {PRESETS.map((port) => (
                            <option key={port.code} value={port.code}>
                              {port.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-[clamp(12px,1.1vw,14px)] text-white/75">
                        <span>{tf("dashboard.focusCard.toLabel", "Arrive at")}</span>
                        <select
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
                          disabled={status === "running"}
                        >
                          {PRESETS.map((port) => (
                            <option key={port.code} value={port.code}>
                              {port.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="text-[clamp(12px,1.1vw,14px)] text-white/75">
                      {flightDuration
                        ? (() => {
                            const formatted = formatDuration(flightDuration * 60);
                            const label = t("dashboard.focusCard.flightDurationLabel", {
                              value: formatted,
                            });
                            return label === "dashboard.focusCard.flightDurationLabel"
                              ? `Flight time ~${formatted}`
                              : label;
                          })()
                        : tf("dashboard.focusCard.flightUnavailable", "Route unavailable. Pick another pair.")}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[clamp(0.95rem,1.2vw,1.2rem)] font-semibold text-white/85">
                      {tf("dashboard.focusCard.controls", "Flight controls")}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {status === "running" ? (
                        <button
                          type="button"
                          onClick={handlePause}
                          className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-[clamp(12px,1.2vw,14px)] font-semibold text-white transition hover:border-white/60 hover:bg-white/15"
                        >
                          {t("dashboard.focusCard.hold")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={status === "paused" ? handleResume : handleStart}
                          className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-[clamp(12px,1.2vw,14px)] font-semibold text-white transition hover:border-white/60 hover:bg-white/15"
                        >
                          {status === "paused" ? t("dashboard.focusCard.resumeFlight") : t("dashboard.focusCard.depart")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-full border border-white/25 px-4 py-2 text-[clamp(12px,1.2vw,14px)] text-white/80 transition hover:border-white/50 hover:text-white"
                      >
                        {t("dashboard.focusCard.divert")}
                      </button>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[clamp(0.95rem,1.2vw,1.2rem)] font-semibold text-white/85">
                      {t("dashboard.focusCard.ambientTitle") || "Ambient info"}
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-[clamp(12px,1.1vw,14px)] text-white/60">
                          {tf("dashboard.focusCard.originLocalTime", "Local time (depart)")}
                        </p>
                        <p className="text-[clamp(16px,1.6vw,20px)] font-semibold text-white">
                          {formatLocalTime(AIRPORT_TIMEZONE[origin])}
                        </p>
                        <p className="text-[clamp(11px,1vw,13px)] text-white/60">{PRESETS.find((p) => p.code === origin)?.label}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-[clamp(12px,1.1vw,14px)] text-white/60">
                          {tf("dashboard.focusCard.destinationLocalTime", "Local time (arrive)")}
                        </p>
                        <p className="text-[clamp(16px,1.6vw,20px)] font-semibold text-white">
                          {formatLocalTime(AIRPORT_TIMEZONE[destination])}
                        </p>
                        <p className="text-[clamp(11px,1vw,13px)] text-white/60">
                          {PRESETS.find((p) => p.code === destination)?.label}
                        </p>
                      </div>
                    </div>
                  </section>

                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

    </>
  );
}
