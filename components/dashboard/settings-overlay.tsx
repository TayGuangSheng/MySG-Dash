"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/language-context";
import { useBusStopContext } from "@/contexts/bus-stop-context";
import { useThemeContext } from "@/contexts/theme-context";
import { useWeatherLocation } from "@/contexts/weather-location-context";
import { resolveLocation } from "@/lib/locations";

export default function SettingsOverlay() {
  const [open, setOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const { availableThemes, themeId, setThemeId } = useThemeContext();
  const { selection, setSelection, presets } = useWeatherLocation();
  const { availableStops: busStopOptions, selectedStops: busSelections, setStopId } = useBusStopContext();
  const { t, language, setLanguage, availableLanguages } = useTranslation();
  const [busStopInputs, setBusStopInputs] = useState<[string, string]>(
    () => busSelections.map((stop) => stop.id) as [string, string],
  );

  const currentLocationId = selection.type === "preset" ? selection.location.id : "custom";

  useEffect(() => {
    if (!open) return;
    setBusStopInputs(busSelections.map((stop) => stop.id) as [string, string]);
  }, [busSelections, open]);

  const handleManualLocation = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    const resolved = resolveLocation(trimmed.startsWith("gps:") ? trimmed : `gps:${trimmed}`);
    setSelection(resolved);
  };

  const handleBusStopPresetChange = (index: 0 | 1, value: string) => {
    if (value === "custom") return;
    setStopId(index, value);
    setBusStopInputs((prev) => {
      const next = [...prev] as [string, string];
      next[index] = value;
      return next;
    });
  };

  const handleBusStopInputChange = (index: 0 | 1, value: string) => {
    setBusStopInputs((prev) => {
      const next = [...prev] as [string, string];
      next[index] = value;
      return next;
    });
  };

  const handleBusStopSave = (index: 0 | 1) => {
    const trimmed = busStopInputs[index].trim();
    if (!trimmed) return;
    setStopId(index, trimmed);
    setBusStopInputs((prev) => {
      const next = [...prev] as [string, string];
      next[index] = trimmed;
      return next;
    });
  };

  return (
    <div className="pointer-events-none fixed right-[clamp(1.2rem,2vw,2.4rem)] bottom-[clamp(1.2rem,2vw,2.4rem)] z-50 flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="pointer-events-auto flex h-[clamp(2.6rem,3vw,3rem)] w-[clamp(2.6rem,3vw,3rem)] items-center justify-center rounded-full border border-white/20 bg-black/30 text-[clamp(1.3rem,1.8vw,1.8rem)] text-white shadow-lg backdrop-blur transition hover:scale-105"
        aria-label={t("dashboard.settings.ariaOpen")}
      >
        <svg
          aria-hidden="true"
          className="h-[clamp(1.3rem,1.8vw,1.8rem)] w-[clamp(1.3rem,1.8vw,1.8rem)] text-white"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.5" />
          <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="12" y1="3.75" x2="12" y2="5.25" />
            <line x1="12" y1="18.75" x2="12" y2="20.25" />
            <line x1="3.75" y1="12" x2="5.25" y2="12" />
            <line x1="18.75" y1="12" x2="20.25" y2="12" />
            <line x1="6.15" y1="6.15" x2="7.2" y2="7.2" />
            <line x1="16.8" y1="16.8" x2="17.85" y2="17.85" />
            <line x1="6.15" y1="17.85" x2="7.2" y2="16.8" />
            <line x1="16.8" y1="7.2" x2="17.85" y2="6.15" />
          </g>
        </svg>
      </button>

      {open && (
        <div className="pointer-events-auto w-[clamp(18rem,24vw,24rem)] max-w-[90vw] rounded-3xl border border-white/15 bg-black/65 p-[clamp(1.2rem,1.6vw,1.8rem)] text-white shadow-2xl backdrop-blur-xl max-h-[min(80vh,40rem)] overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between">
            <h2 className="text-[clamp(1.1rem,1.4vw,1.5rem)] font-semibold">{t("dashboard.settings.title")}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/15 px-3 py-1 text-[clamp(0.75rem,0.9vw,0.95rem)] text-white/70 hover:border-white/40"
            >
              {t("common.actions.close")}
            </button>
          </div>

          <section className="mt-4 space-y-3">
            <h3 className="text-[clamp(0.9rem,1.1vw,1.15rem)] font-semibold uppercase tracking-[0.25em] text-white/70">
              {t("dashboard.settings.themeHeading")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {availableThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setThemeId(theme.id)}
                  className={`rounded-2xl border px-3 py-2 text-left text-[clamp(0.8rem,0.95vw,1rem)] transition ${
                    themeId === theme.id
                      ? "border-white/70 bg-white/15"
                      : "border-white/15 bg-white/5 hover:border-white/40"
                  }`}
                  style={{ background: theme.id === themeId ? theme.background : undefined }}
                >
                  <span className="block font-semibold">{theme.label}</span>
                  <span className="block text-[clamp(0.7rem,0.85vw,0.9rem)] text-white/70">
                    {t("dashboard.settings.themeAccent", { color: theme.accent })}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 space-y-3">
            <h3 className="text-[clamp(0.9rem,1.1vw,1.15rem)] font-semibold uppercase tracking-[0.25em] text-white/70">
              {t("dashboard.settings.languageHeading")}
            </h3>
            <p className="text-[clamp(0.75rem,0.9vw,0.95rem)] text-white/60">
              {t("dashboard.settings.languageDescription")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {availableLanguages.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setLanguage(option.code)}
                  className={`rounded-2xl border px-3 py-2 text-left text-[clamp(0.8rem,0.95vw,1rem)] transition ${
                    language === option.code
                      ? "border-white/70 bg-white/15"
                      : "border-white/15 bg-white/5 hover:border-white/40"
                  }`}
                >
                  <span className="block font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 space-y-3">
            <h3 className="text-[clamp(0.9rem,1.1vw,1.15rem)] font-semibold uppercase tracking-[0.25em] text-white/70">
              {t("dashboard.settings.weatherHeading")}
            </h3>
            <label className="block text-[clamp(0.75rem,0.9vw,0.95rem)] text-white/70">
              {t("dashboard.settings.weatherPresetLabel")}
              <select
                value={currentLocationId}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "custom") return;
                  const preset = presets.find((item) => item.id === value);
                  if (preset) setSelection({ type: "preset", location: preset });
                }}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-white"
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">{t("dashboard.settings.weatherCustomOption")}</option>
              </select>
            </label>
            <div className="space-y-2">
              <label className="block text-[clamp(0.75rem,0.9vw,0.95rem)] text-white/70">
                {t("dashboard.settings.gpsLabel")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={manualInput}
                  onChange={(event) => setManualInput(event.target.value)}
                  placeholder={t("dashboard.settings.gpsPlaceholder")}
                  className="flex-1 rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white placeholder:text-white/40"
                />
                <button
                  type="button"
                  onClick={handleManualLocation}
                  className="rounded-xl border border-white/30 px-3 py-2 text-[clamp(0.75rem,0.9vw,0.95rem)] text-white hover:border-white/50"
                >
                  {t("dashboard.settings.gpsSave")}
                </button>
              </div>
              {selection.type === "gps" && (
                <p className="text-[clamp(0.7rem,0.85vw,0.9rem)] text-white/60">
                  {t("dashboard.settings.gpsUsing", {
                    lat: selection.lat.toFixed(3),
                    lon: selection.lon.toFixed(3),
                  })}
                </p>
              )}
            </div>
          </section>

          <section className="mt-6 space-y-4">
            <h3 className="text-[clamp(0.9rem,1.1vw,1.15rem)] font-semibold uppercase tracking-[0.25em] text-white/70">
              {t("dashboard.settings.busHeading")}
            </h3>
            {[0, 1].map((index) => {
              const stop = busSelections[index];
              const presetMatch = busStopOptions.find((option) => option.id === stop.id);
              const selectValue = presetMatch ? presetMatch.id : "custom";
              const pendingValue = busStopInputs[index];
              const isDirty = pendingValue.trim() !== stop.id;

              return (
                <div
                  key={index}
                  className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[clamp(0.8rem,0.95vw,1rem)] font-medium text-white/80">
                      {t("dashboard.settings.busStopLabel", { index: index + 1 })}
                    </span>
                    <select
                      value={selectValue}
                      onChange={(event) => handleBusStopPresetChange(index as 0 | 1, event.target.value)}
                      className="rounded-xl border border-white/20 bg-black/30 px-2 py-1 text-[clamp(0.75rem,0.9vw,0.95rem)] text-white"
                    >
                      {busStopOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                      <option value="custom">{t("dashboard.settings.busCustomOption")}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={pendingValue}
                      onChange={(event) => handleBusStopInputChange(index as 0 | 1, event.target.value)}
                      placeholder={t("dashboard.settings.busPlaceholder")}
                      className="flex-1 rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white placeholder:text-white/40"
                    />
                    <button
                      type="button"
                      onClick={() => handleBusStopSave(index as 0 | 1)}
                      className="rounded-xl border border-white/30 px-3 py-2 text-[clamp(0.75rem,0.9vw,0.95rem)] text-white hover:border-white/50 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
                      disabled={!pendingValue.trim() || !isDirty}
                    >
                      {t("dashboard.settings.busSave")}
                    </button>
                  </div>
                  <p className="text-[clamp(0.7rem,0.85vw,0.9rem)] text-white/60">
                    {t("dashboard.settings.busShowing", { label: stop.label })}
                  </p>
                </div>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
}
