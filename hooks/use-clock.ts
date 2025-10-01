"use client";

import { useEffect, useMemo, useState } from "react";

const SG_TIMEZONE = "Asia/Singapore";

const TIME_FORMATTER = new Intl.DateTimeFormat("en-SG", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: SG_TIMEZONE,
});

const SECOND_FORMATTER = new Intl.DateTimeFormat("en-SG", {
  second: "2-digit",
  timeZone: SG_TIMEZONE,
});

const DAY_FORMATTER = new Intl.DateTimeFormat("en-SG", {
  weekday: "long",
  timeZone: SG_TIMEZONE,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-SG", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: SG_TIMEZONE,
});

const ANALOG_FORMATTER = new Intl.DateTimeFormat("en-SG", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: SG_TIMEZONE,
});

export type ClockTick = {
  now: Date;
  iso: string;
  time: string;
  seconds: string;
  day: string;
  date: string;
};

export function useClock(updateIntervalMs = 1000): ClockTick {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, updateIntervalMs);

    return () => clearInterval(interval);
  }, [updateIntervalMs]);

  return useMemo(() => {
    return {
      now,
      iso: now.toISOString(),
      time: TIME_FORMATTER.format(now),
      seconds: SECOND_FORMATTER.format(now),
      day: DAY_FORMATTER.format(now),
      date: DATE_FORMATTER.format(now),
    };
  }, [now]);
}

export function getAnalogAngles(date: Date) {
  const parts = ANALOG_FORMATTER.formatToParts(date);
  const getPart = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const hours = getPart("hour");
  const minutes = getPart("minute");
  const seconds = getPart("second");

  return {
    hourAngle: ((hours % 12) + minutes / 60) * 30,
    minuteAngle: (minutes + seconds / 60) * 6,
    secondAngle: seconds * 6,
  };
}