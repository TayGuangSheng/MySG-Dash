"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/contexts/language-context";

type TimerStatus = "idle" | "running" | "paused" | "done";

const PRESETS = [10, 20, 30] as const;

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
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(20);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(selectedMinutes * 60);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [endTime, setEndTime] = useState<number | null>(null);

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

  const handleSelect = (minutes: number) => {
    setSelectedMinutes(minutes);
    setStatus("idle");
  };

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
    idle: t("dashboard.focusCard.status.idle"),
    running: t("dashboard.focusCard.status.running"),
    paused: t("dashboard.focusCard.status.paused"),
    done: t("dashboard.focusCard.status.done"),
  }[status];

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
          <span aria-hidden="true">{"\u23F3"}</span>
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
                    <h2 id="focus-dialog-title" className="text-[clamp(1.2rem,1.6vw,1.8rem)] font-semibold">
                      {t("dashboard.focusCard.title")}
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
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[color:var(--highlight-color,#38bdf8)] transition-[width]"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  </div>

                  <section className="space-y-3">
                    <h3 className="text-[clamp(0.95rem,1.2vw,1.2rem)] font-semibold text-white/85">
                      {t("dashboard.focusCard.durationLabel")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((minutes) => (
                        <button
                          key={minutes}
                          type="button"
                          onClick={() => handleSelect(minutes)}
                          className={`rounded-full border px-3 py-1.5 text-[clamp(12px,1.2vw,14px)] transition ${
                            selectedMinutes === minutes
                              ? "border-white/70 bg-white/15 text-white"
                              : "border-white/20 bg-white/5 text-white/70 hover:border-white/50 hover:text-white"
                          }`}
                          disabled={status === "running"}
                        >
                          {t("dashboard.focusCard.minutes", { value: minutes })}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[clamp(0.95rem,1.2vw,1.2rem)] font-semibold text-white/85">
                      {t("dashboard.focusCard.title")}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {status === "running" ? (
                        <button
                          type="button"
                          onClick={handlePause}
                          className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-[clamp(12px,1.2vw,14px)] font-semibold text-white transition hover:border-white/60 hover:bg-white/15"
                        >
                          {t("dashboard.focusCard.pause")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={status === "paused" ? handleResume : handleStart}
                          className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-[clamp(12px,1.2vw,14px)] font-semibold text-white transition hover:border-white/60 hover:bg-white/15"
                        >
                          {status === "paused" ? t("dashboard.focusCard.resume") : t("dashboard.focusCard.start")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-full border border-white/25 px-4 py-2 text-[clamp(12px,1.2vw,14px)] text-white/80 transition hover:border-white/50 hover:text-white"
                      >
                        {t("dashboard.focusCard.reset")}
                      </button>
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
