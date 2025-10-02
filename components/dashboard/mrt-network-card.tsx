"use client";

import { Card } from "@/components/ui/card";
import { useTranslation, type Translator } from "@/contexts/language-context";
import { useTrainStatus } from "@/hooks/use-train-status";
import { formatSingaporeTime } from "@/lib/format";
import type { TrainStatus } from "@/types/api";

const LINES = [
  { id: "NSL", key: "nsl", color: "#d42d1f" },
  { id: "EWL", key: "ewl", color: "#009645" },
  { id: "NEL", key: "nel", color: "#9900aa" },
  { id: "CCL", key: "ccl", color: "#fa9e0d" },
  { id: "DTL", key: "dtl", color: "#005ec4" },
  { id: "TEL", key: "tel", color: "#784942" },
] as const;

export default function MRTNetworkCard() {
  const { status, isLoading, error } = useTrainStatus();
  const { t, locale } = useTranslation();
  const byLine = new Map(status?.lines.map((line) => [line.line, line]));
  const updated = status?.updatedAt ? formatSingaporeTime(status.updatedAt, locale) : "--:--";

  return (
    <Card className="flex h-full min-h-0 flex-col gap-[clamp(12px,1.1vw,18px)] overflow-hidden p-[clamp(16px,1.5vw,28px)]">
      <header className="flex min-w-0 flex-col gap-[clamp(4px,0.6vw,8px)]">
        <span className="text-[clamp(16px,2vw,24px)] font-semibold text-white">
          {t("dashboard.mrtCard.title")}
        </span>
        <span className="text-[clamp(10px,1.2vw,14px)] font-normal text-white/70">
          {t("dashboard.mrtCard.updated", { time: updated })}
        </span>
      </header>

      <section className="flex-1 min-h-0 overflow-hidden">
        <div className="grid h-full min-h-0 auto-rows-[minmax(46px,1fr)] grid-cols-1 gap-[clamp(8px,0.8vw,12px)] md:grid-cols-2">
          {LINES.map((line) => {
            const record = byLine.get(line.id);
            const rawStatus = record?.status ?? "Normal";
            const statusLabel = translateStatus(rawStatus, t);
            return (
              <LineTile
                key={line.id}
                line={line.id}
                label={t(`dashboard.mrtCard.lines.${line.key}`)}
                color={line.color}
                status={rawStatus}
                statusLabel={statusLabel}
              />
            );
          })}
        </div>
        {error && (
          <p className="mt-[clamp(6px,0.6vw,10px)] truncate text-[clamp(10px,1.2vw,14px)] text-amber-200/80">
            {error.message}
          </p>
        )}
        {isLoading && !status && (
          <p className="mt-[clamp(6px,0.6vw,10px)] truncate text-[clamp(10px,1.2vw,14px)] text-white/60">
            {t("dashboard.mrtCard.loading")}
          </p>
        )}
      </section>
    </Card>
  );
}

type LineTileProps = {
  line: string;
  label: string;
  color: string;
  status: TrainStatus;
  statusLabel: string;
};

function LineTile({ line, label, color, status, statusLabel }: LineTileProps) {
  return (
    <article
      aria-label={`${line} ${statusLabel}`}
      className="flex h-full min-h-0 flex-col justify-between gap-1.2 rounded-xl border border-white/12 bg-white/5 px-[clamp(10px,0.9vw,14px)] py-[clamp(6px,0.5vw,14px)] shadow-inner"
    >
      <div className="flex items-center gap-2">
        <span
          className="h-1 w-6 flex-shrink-0 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        <span className="truncate text-[clamp(9px,0.85vw,11px)] font-semibold uppercase tracking-[0.24em] text-white">
          {line}
        </span>
      </div>

      <p className={`truncate text-[clamp(8px,0.8vw,10px)] font-semibold ${statusColor(status)}`}>
        {statusLabel}
      </p>
    </article>
  );
}

function statusColor(status: TrainStatus) {
  switch (status) {
    case "Normal":
      return "text-emerald-400";
    case "Delay":
      return "text-amber-300";
    case "Disrupted":
      return "text-rose-400";
    default:
      return "text-white";
  }
}

function translateStatus(status: TrainStatus, t: Translator) {
  switch (status) {
    case "Normal":
      return t("dashboard.mrtCard.statuses.normal");
    case "Delay":
      return t("dashboard.mrtCard.statuses.delay");
    case "Disrupted":
      return t("dashboard.mrtCard.statuses.disrupted");
    default:
      return status;
  }
}