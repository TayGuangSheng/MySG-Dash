"use client";

import { useTranslation, type Translator } from "@/contexts/language-context";
import { Card } from "@/components/ui/card";
import { useBusArrivals } from "@/hooks/use-bus-arrivals";
import { formatSingaporeTime } from "@/lib/format";
import type { BusArrival } from "@/types/api";

export default function BusStopCard({ label, stopId }: { label: string; stopId: string }) {
  const { t, locale } = useTranslation();
  const { arrivals, isLoading, error } = useBusArrivals(stopId);
  const services = arrivals?.etas ?? [];
  const displayedServices = services.slice(0, 12);
  const updatedTime = arrivals?.updatedAt ? formatSingaporeTime(arrivals.updatedAt, locale) : "--:--";

  return (
    <Card className="flex flex-col gap-[clamp(16px,1.4vw,24px)] p-[clamp(20px,1.8vw,32px)]">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-[clamp(8px,1vw,14px)]">
        <span className="flex items-center gap-2 truncate text-[clamp(16px,2vw,24px)] font-semibold text-white">
          <span aria-hidden="true">{"\uD83D\uDE8C"}</span>
          <span className="truncate">{label}</span>
        </span>
        <span className="text-[clamp(10px,1.2vw,14px)] font-normal text-white/70">
          {t("dashboard.busCard.updated", { time: updatedTime })}
        </span>
      </header>

      <section className="flex-1">
        {displayedServices.length ? (
          <div className="grid h-full grid-cols-3 content-start gap-[clamp(4px,0.6vw,8px)] auto-rows-[minmax(0,118px)]">
            {displayedServices.map((service) => (
              <BusService key={service.service} service={service} />
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[90px] items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-[clamp(12px,1.4vw,18px)] text-[clamp(12px,1.4vw,16px)] text-white/70">
            {arrivals?.note ?? (isLoading ? t("dashboard.busCard.fetching") : t("dashboard.busCard.noArrivals"))}
          </div>
        )}
      </section>

      <footer className="mt-auto min-h-0 text-[clamp(12px,1.4vw,16px)] text-white/60">
        {error && <p className="text-amber-200/80">{error.message}</p>}
        {isLoading && <p className="text-white/55">{t("dashboard.busCard.refreshing")}</p>}
      </footer>
    </Card>
  );
}

type BusServiceProps = {
  service: BusArrival;
};

function BusService({ service }: BusServiceProps) {
  const { t } = useTranslation();
  const [next, ...rest] = service.arrivals;

  return (
    <article className="grid min-h-0 grid-rows-[auto_1fr] gap-[clamp(4px,0.4vw,6px)] rounded-xl border border-white/12 bg-white/5 px-[clamp(8px,1vw,12px)] py-[clamp(6px,0.8vw,10px)] shadow-inner">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="text-[clamp(14px,1.6vw,20px)] font-semibold tracking-tight">{service.service}</span>
        {next?.load ? <LoadBadge load={next.load} translator={t} /> : <StatusBadge status={service.status} />}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-[clamp(2px,0.4vw,4px)]">
          <span className="text-[clamp(18px,2.5vw,32px)] font-semibold leading-none">
            {formatEta(next?.etaMin)}
          </span>
          {next ? (
            <span className="text-[clamp(8px,1vw,12px)] text-white/60">
              {t("dashboard.busCard.minuteSuffix")}
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-[clamp(4px,0.6vw,8px)] text-[clamp(8px,1vw,12px)] text-white/70">
          {rest.length ? (
            rest.slice(0, 2).map((entry, index) => (
              <span key={index} className="rounded-full border border-white/20 px-2 py-0.5 text-white/80">
                {formatEta(entry.etaMin)}
              </span>
            ))
          ) : null}
        </div>
      </div>
    </article>
  );
}

function LoadBadge({
  load,
  translator,
}: {
  load: BusArrival["arrivals"][number]["load"];
  translator: Translator;
}) {
  const { text, color } = loadLabel(load, translator);
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[clamp(8px,1vw,12px)] font-medium"
      style={{ borderColor: color, color }}
    >
      {text}
    </span>
  );
}

function loadLabel(load: BusArrival["arrivals"][number]["load"], t: Translator) {
  switch (load) {
    case "SEA":
      return { text: t("dashboard.busCard.load.seats"), color: "#4ade80" };
    case "SDA":
      return { text: t("dashboard.busCard.load.some"), color: "#facc15" };
    case "LSD":
      return { text: t("dashboard.busCard.load.full"), color: "#f87171" };
    default:
      return { text: t("dashboard.busCard.load.unknown"), color: "#d1d1d6" };
  }
}

function formatEta(value?: number) {
  if (value === undefined || value === null) return "--";
  if (value <= 0) return "0";
  return String(value);
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span className="rounded-full border border-white/25 px-2 py-0.5 text-[clamp(8px,1vw,12px)] text-white/70">
      {status}
    </span>
  );
}
