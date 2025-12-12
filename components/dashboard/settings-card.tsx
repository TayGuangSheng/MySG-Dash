"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { Card } from "@/components/ui/card";
import { useBusStopContext } from "@/contexts/bus-stop-context";
import { useThemeContext } from "@/contexts/theme-context";
import { useTranslation } from "@/contexts/language-context";
import { useWeatherLocation } from "@/contexts/weather-location-context";
import { resolveLocation } from "@/lib/locations";

export default function SettingsCard() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex h-full min-h-[72px] w-full cursor-pointer flex-col justify-center gap-1.5 p-[clamp(12px,1vw,18px)] transition hover:shadow-[0_0_0_2px_rgba(255,255,255,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/80"
        aria-label={t("dashboard.settingsCard.title")}
      >
        <span className="flex items-center gap-2 text-[clamp(16px,2vw,24px)] font-semibold text-white">
          <span aria-hidden="true">{"\u2699\uFE0F"}</span>
          {t("dashboard.settingsCard.title")}
        </span>
      </Card>

      {open ? <SettingsModal onClose={handleToggle} /> : null}
    </>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const { availableThemes, themeId, setThemeId } = useThemeContext();
  const { selection, setSelection, presets } = useWeatherLocation();
  const {
    availableStops: busStopOptions,
    selectedStops: busSelections,
    setStopId,
    setStopCustomName,
  } = useBusStopContext();
  const { t, language, setLanguage, availableLanguages } = useTranslation();
  const [busStopInputs, setBusStopInputs] = useState<[string, string]>(() =>
    busSelections.map((stop) => stop.id) as [string, string],
  );
  const [busNameInputs, setBusNameInputs] = useState<[string, string]>(() =>
    busSelections.map((stop) => stop.customName ?? "") as [string, string],
  );

  const currentLocationId = selection.type === "preset" ? selection.location.id : "custom";

  useEffect(() => {
    setBusStopInputs(busSelections.map((stop) => stop.id) as [string, string]);
    setBusNameInputs(busSelections.map((stop) => stop.customName ?? "") as [string, string]);
  }, [busSelections]);

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
    setBusNameInputs((prev) => {
      const next = [...prev] as [string, string];
      next[index] = "";
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
    setBusNameInputs((prev) => {
      const next = [...prev] as [string, string];
      next[index] = "";
      return next;
    });
  };

  const handleBusNameInputChange = (index: 0 | 1, value: string) => {
    setBusNameInputs((prev) => {
      const next = [...prev] as [string, string];
      next[index] = value;
      return next;
    });
  };

  const handleBusNameSave = (index: 0 | 1) => {
    const value = busNameInputs[index];
    const trimmed = value.trim();
    setStopCustomName(index, trimmed);
    setBusNameInputs((prev) => {
      const next = [...prev] as [string, string];
      next[index] = trimmed;
      return next;
    });
  };

  const handleBusNameReset = (index: 0 | 1) => {
    setStopCustomName(index, "");
    setBusNameInputs((prev) => {
      const next = [...prev] as [string, string];
      next[index] = "";
      return next;
    });
  };

  const themeOptions = useMemo(
    () =>
      availableThemes.map((theme) => ({
        id: theme.id,
        label: theme.label,
        accent: theme.accent,
      })),
    [availableThemes],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur">
      <div className="relative flex h-[min(92vh,720px)] w-[min(100%,960px)] flex-col overflow-hidden rounded-3xl border border-white/15 bg-black/85 text-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-[clamp(1.2rem,1.6vw,1.8rem)] font-semibold">
              {t("dashboard.settings.title")}
            </h2>
            <p className="text-[clamp(0.8rem,1vw,1rem)] text-white/70">
              {t("dashboard.settings.languageDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/80 transition hover:border-white/60 hover:text-white"
          >
            {t("common.actions.close")}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <section className="space-y-3">
            <h3 className="text-[clamp(0.9rem,1.1vw,1.15rem)] font-semibold uppercase tracking-[0.25em] text-white/70">
              {t("dashboard.settings.themeHeading")}
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {themeOptions.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setThemeId(theme.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    themeId === theme.id
                      ? "border-white/60 bg-white/15 text-white"
                      : "border-white/15 bg-white/5 text-white/70 hover:border-white/35"
                  }`}
                >
                  <span className="block text-[clamp(0.9rem,1vw,1.05rem)] font-semibold">{theme.label}</span>
                  <span className="text-[clamp(0.75rem,0.9vw,0.95rem)] text-white/55">
                    {t("dashboard.settings.themeAccent", { color: theme.accent.toUpperCase() })}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[clamp(0.9rem,1.1vw,1.15rem)] font-semibold uppercase tracking-[0.25em] text-white/70">
              {t("dashboard.settings.languageHeading")}
            </h3>
            <div className="flex flex-wrap gap-3">
              {availableLanguages.map((entry) => (
                <button
                  key={entry.code}
                  type="button"
                  onClick={() => setLanguage(entry.code)}
                  className={`rounded-2xl border px-4 py-2 text-[clamp(0.85rem,1vw,1rem)] transition ${
                    language === entry.code
                      ? "border-white/60 bg-white/15 text-white"
                      : "border-white/15 bg-white/5 text-white/70 hover:border-white/35"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[clamp(0.9rem,1.1vw,1.15rem)] font-semibold uppercase tracking-[0.25em] text-white/70">
              {t("dashboard.settings.weatherHeading")}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[clamp(0.75rem,0.9vw,1rem)] text-white/70">{t("dashboard.settings.weatherPresetLabel")}</p>
                <div className="flex items-center gap-3">
                  <select
                    value={currentLocationId}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "custom") return;
                      const preset = presets.find((item) => item.id === value);
                      if (preset) {
                        setSelection({ type: "preset", location: preset });
                      }
                    }}
                    className="flex-1 rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
                  >
                    {presets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                    <option value="custom">{t("dashboard.settings.weatherCustomOption")}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-[clamp(0.75rem,0.9vw,1rem)] text-white/70">{t("dashboard.settings.gpsLabel")}</p>
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
                {selection.type === "gps" ? (
                  <p className="text-[clamp(0.75rem,0.9vw,0.95rem)] text-white/60">
                    {t("dashboard.settings.gpsUsing", {
                      lat: selection.lat.toFixed(3),
                      lon: selection.lon.toFixed(3),
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[clamp(0.9rem,1.1vw,1.15rem)] font-semibold uppercase tracking-[0.25em] text-white/70">
              {t("dashboard.settings.busHeading")}
            </h3>
            {[0, 1].map((index) => {
              const stop = busSelections[index];
              const presetMatch = busStopOptions.find((option) => option.id === stop.id);
              const selectValue = presetMatch ? presetMatch.id : "custom";
              const pendingValue = busStopInputs[index];
              const isDirty = pendingValue.trim() !== stop.id;
              const pendingName = busNameInputs[index];
              const currentName = stop.customName ?? "";
              const isNameDirty = pendingName.trim() !== currentName.trim();
              const baseLabel = t("dashboard.doorboard.busStopLabel", { label: stop.label });
              const displayLabel = currentName.trim() || baseLabel;

              return (
                <div key={index} className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[clamp(0.85rem,1vw,1.05rem)] font-medium text-white/80">
                      {t("dashboard.settings.busStopLabel", { index: index + 1 })}
                    </span>
                    <select
                      value={selectValue}
                      onChange={(event) => handleBusStopPresetChange(index as 0 | 1, event.target.value)}
                      className="rounded-xl border border-white/20 bg-black/30 px-2 py-1.5 text-[clamp(0.75rem,0.9vw,0.95rem)] text-white"
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
                  <div className="space-y-2">
                    <label className="block text-[clamp(0.75rem,0.9vw,0.95rem)] text-white/70">
                      {t("dashboard.settings.busNameLabel")}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        value={pendingName}
                        onChange={(event) => handleBusNameInputChange(index as 0 | 1, event.target.value)}
                        placeholder={t("dashboard.settings.busNamePlaceholder")}
                        className="flex-1 rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white placeholder:text-white/40"
                      />
                      <button
                        type="button"
                        onClick={() => handleBusNameSave(index as 0 | 1)}
                        className="rounded-xl border border-white/30 px-3 py-2 text-[clamp(0.75rem,0.9vw,0.95rem)] text-white hover:border-white/50 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
                        disabled={!isNameDirty}
                      >
                        {t("common.actions.save")}
                      </button>
                    </div>
                    {currentName.trim() ? (
                      <button
                        type="button"
                        onClick={() => handleBusNameReset(index as 0 | 1)}
                        className="text-left text-[clamp(0.7rem,0.85vw,0.9rem)] text-white/60 underline-offset-2 hover:underline"
                      >
                        {t("dashboard.settings.busNameReset")}
                      </button>
                    ) : null}
                  </div>
                  <p className="text-[clamp(0.7rem,0.85vw,0.9rem)] text-white/60">
                    {t("dashboard.settings.busShowing", { label: displayLabel })}
                  </p>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
