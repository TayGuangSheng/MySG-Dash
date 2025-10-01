"use client";

import { useEffect, useMemo, useState } from "react";

const SG_TIMEZONE = "Asia/Singapore";

function createFormatters(locale: string) {
  return {
    time: new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: SG_TIMEZONE,
    }),
    second: new Intl.DateTimeFormat(locale, {
      second: "2-digit",
      timeZone: SG_TIMEZONE,
    }),
    day: new Intl.DateTimeFormat(locale, {
      weekday: "long",
      timeZone: SG_TIMEZONE,
    }),
    date: new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: SG_TIMEZONE,
    }),
  } as const;
}

export type ClockTick = {
  now: Date;
  iso: string;
  time: string;
  seconds: string;
  day: string;
  date: string;
};

export function useClock(updateIntervalMs = 1000, locale = "en-SG"): ClockTick {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, updateIntervalMs);

    return () => clearInterval(interval);
  }, [updateIntervalMs]);

  const formatters = useMemo(() => createFormatters(locale), [locale]);

  return useMemo(() => {
    return {
      now,
      iso: now.toISOString(),
      time: formatters.time.format(now),
      seconds: formatters.second.format(now),
      day: formatters.day.format(now),
      date: formatters.date.format(now),
    };
  }, [formatters, now]);
}

export function getAnalogAngles(date: Date, locale = "en-SG") {
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: SG_TIMEZONE,
  });
  const parts = formatter.formatToParts(date);
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
