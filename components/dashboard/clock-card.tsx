"use client";

import { useMemo, type CSSProperties } from "react";
import { Card } from "@/components/ui/card";
import { getDailyQuote } from "@/lib/quotes";
import { useClock, getAnalogAngles } from "@/hooks/use-clock";

const SG_LABEL = "Singapore";
const SG_TIMEZONE = "Asia/Singapore";

export default function ClockCard() {
  const clock = useClock(1000);
  const angles = getAnalogAngles(clock.now);

  const quote = useMemo(() => {
    const seed = new Intl.DateTimeFormat("en-SG", {
      timeZone: SG_TIMEZONE,
      weekday: "long",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(clock.now);
    return getDailyQuote(seed);
  }, [clock.now]);

  return (
    <Card className="flex flex-col gap-[clamp(16px,1.6vw,24px)] p-[clamp(16px,1.8vw,32px)]">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-[clamp(16px,1.6vw,24px)]">
        <div className="flex min-w-0 flex-col gap-[clamp(4px,0.6vw,8px)]">
          <span className="text-[clamp(10px,1.2vw,14px)] font-medium uppercase tracking-[0.3em] text-white/70">
            {SG_LABEL}
          </span>
          <div className="flex min-w-0 items-end gap-[clamp(8px,1vw,14px)]">
            <span className="truncate text-[clamp(28px,5vw,70px)] font-semibold leading-none tracking-tight">
              {clock.time}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-[clamp(8px,1vw,12px)] py-[clamp(3px,0.5vw,5px)] text-[clamp(16px,2.5vw,32px)] font-semibold text-white/85">
              {clock.seconds}
            </span>
          </div>
        </div>
        <AnalogClock hourAngle={angles.hourAngle} minuteAngle={angles.minuteAngle} secondAngle={angles.secondAngle} />
      </header>

      <dl className="grid grid-cols-1 gap-[clamp(8px,1.2vw,14px)] text-[clamp(14px,1.8vw,20px)] font-medium sm:grid-cols-2">
        <div className="flex min-w-0 flex-col">
          <dt className="text-[clamp(12px,1.4vw,16px)] uppercase tracking-[0.35em] text-white/55">Day</dt>
          <dd className="truncate text-white/90">{clock.day}</dd>
        </div>
        <div className="flex min-w-0 flex-col">
          <dt className="text-[clamp(12px,1.4vw,16px)] uppercase tracking-[0.35em] text-white/55">Date</dt>
          <dd className="truncate text-white/90">{clock.date}</dd>
        </div>
      </dl>

      <footer className="mt-auto flex min-w-0 flex-col gap-[clamp(6px,0.8vw,10px)] text-[clamp(12px,1.4vw,16px)] text-white/80">
        <p className="text-balance font-semibold leading-snug">&quot;{quote.text}&quot;</p>
      </footer>
    </Card>
  );
}

type AnalogProps = {
  hourAngle: number;
  minuteAngle: number;
  secondAngle: number;
};

function AnalogClock({ hourAngle, minuteAngle, secondAngle }: AnalogProps) {
  return (
    <div className="relative h-[clamp(70px,11vw,120px)] w-[clamp(70px,11vw,120px)] min-w-[clamp(70px,11vw,120px)]">
      <div className="absolute inset-0 rounded-full border border-white/20 bg-white/5 backdrop-blur">
        <div className="absolute inset-[15%] rounded-full border border-dashed border-white/10" />
        <ClockHand angle={hourAngle} length="30%" thickness="2px" opacity={0.9} />
        <ClockHand angle={minuteAngle} length="40%" thickness="1.5px" opacity={0.8} />
        <ClockHand angle={secondAngle} length="45%" thickness="1px" color="var(--highlight-color)" opacity={0.9} />
        <div className="absolute inset-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>
    </div>
  );
}

function ClockHand({
  angle,
  length,
  thickness,
  color = "rgba(255,255,255,0.9)",
  opacity = 1,
}: {
  angle: number;
  length: string;
  thickness: string;
  color?: string;
  opacity?: number;
}) {
  const style: CSSProperties = {
    width: thickness,
    height: length,
    background: color,
    opacity,
    transform: `translate(-50%, -100%) rotate(${angle}deg)`,
    borderRadius: "999px",
  };

  return <div className="absolute left-1/2 top-1/2 origin-bottom" style={style} />;
}
