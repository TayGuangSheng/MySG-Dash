"use client";

import { Card } from "@/components/ui/card";
import { useBusArrivals } from "@/hooks/use-bus-arrivals";
import { formatSingaporeTime } from "@/lib/format";
import type { BusArrival } from "@/types/api";

export default function BusStopCard({ label, stopId }: { label: string; stopId: string }) {
  const { arrivals, isLoading, error } = useBusArrivals(stopId);

  return (
    <Card className="flex flex-col gap-[clamp(16px,1.4vw,24px)] p-[clamp(20px,1.8vw,32px)]">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-[clamp(8px,1vw,14px)]">
        <span className="truncate text-[clamp(16px,2vw,24px)] font-semibold text-white">{label}</span>
        <span className="text-[clamp(10px,1.2vw,14px)] font-normal text-white/70">
          Updated {arrivals?.updatedAt ? formatSingaporeTime(arrivals.updatedAt) : "--:--"}
        </span>
      </header>

      <section className="flex-1">
        {arrivals?.etas?.length ? (
          <div className="grid h-full min-h-0 grid-cols-3 gap-[clamp(4px,0.6vw,8px)] auto-rows-[120px]">
            {/* Changed auto-rows-[minmax(60px,1fr)] to auto-rows-[60px] */}
            {arrivals.etas.map((service) => (
              <BusService key={service.service} service={service} />
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[90px] items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-[clamp(12px,1.4vw,18px)] text-[clamp(12px,1.4vw,16px)] text-white/70">
            {arrivals?.note ?? (isLoading ? "Fetching incoming buses..." : "No arrivals reported.")}
          </div>
        )}
      </section>

      <footer className="mt-auto min-h-0 text-[clamp(12px,1.4vw,16px)] text-white/60">
        {error && <p className="text-amber-200/80">{error.message}</p>}
        {isLoading && <p className="text-white/55">Refreshing bus times...</p>}
      </footer>
    </Card>
  );
}

type BusServiceProps = {
  service: BusArrival;
};

function BusService({ service }: BusServiceProps) {
  const [next, ...rest] = service.arrivals;

  return (
    <article className="grid min-h-0 grid-rows-[auto_1fr] gap-[clamp(4px,0.4vw,6px)] rounded-xl border border-white/12 bg-white/5 px-[clamp(8px,1vw,12px)] py-[clamp(6px,0.8vw,10px)] shadow-inner">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="text-[clamp(14px,1.6vw,20px)] font-semibold tracking-tight">{service.service}</span>
        {next?.load && <LoadBadge load={next.load} />}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-[clamp(2px,0.4vw,4px)]">
          <span className="text-[clamp(18px,2.5vw,32px)] font-semibold leading-none">
            {formatEta(next?.etaMin)}
          </span>
          <span className="text-[clamp(8px,1vw,12px)] text-white/60">min</span>
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

function LoadBadge({ load }: { load: BusArrival["arrivals"][number]["load"] }) {
  const { text, color } = loadLabel(load);
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[clamp(8px,1vw,12px)] font-medium"
      style={{ borderColor: color, color }}
    >
      {text}
    </span>
  );
}

function loadLabel(load?: BusArrival["arrivals"][number]["load"]) {
  switch (load) {
    case "SEA":
      return { text: "Seats", color: "#4ade80" };
    case "SDA":
      return { text: "Some", color: "#facc15" };
    case "LSD":
      return { text: "Full", color: "#f87171" };
    default:
      return { text: "--", color: "#d1d1d6" };
  }
}

function formatEta(value?: number) {
  if (value === undefined || value === null) return "--";
  if (value <= 0) return "0";
  return String(value);
}
