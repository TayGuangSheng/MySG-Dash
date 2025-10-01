"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { BUS_STOPS } from "@/lib/config";

type BusStopOption = (typeof BUS_STOPS)[number];

export type BusStopSelection = {
  id: string;
  label: string;
};

type BusStopSelections = [BusStopSelection, BusStopSelection];

type BusStopContextValue = {
  availableStops: readonly BusStopOption[];
  selectedStops: BusStopSelections;
  setStopId: (index: 0 | 1, stopId: string) => void;
};

const defaultStops: BusStopSelection[] = BUS_STOPS.slice(0, 2).map((stop) => ({
  id: stop.id,
  label: stop.label,
}));

while (defaultStops.length < 2) {
  defaultStops.push({ id: "", label: "" });
}

const DEFAULT_SELECTED_STOPS = defaultStops as BusStopSelections;

const BusStopContext = createContext<BusStopContextValue | undefined>(undefined);

export function BusStopProvider({ children }: { children: React.ReactNode }) {
  const [selectedStops, setSelectedStops] = useState<BusStopSelections>(DEFAULT_SELECTED_STOPS);

  const setStopId = useCallback((index: 0 | 1, stopId: string) => {
    const trimmed = stopId.trim();
    if (!trimmed) {
      return;
    }

    setSelectedStops((prev) => {
      const matchedPreset = BUS_STOPS.find((preset) => preset.id === trimmed);
      const replacement: BusStopSelection = {
        id: trimmed,
        label: matchedPreset?.label ?? trimmed,
      };

      const next: BusStopSelections = [...prev] as BusStopSelections;
      next[index] = replacement;
      return next;
    });
  }, []);

  const value = useMemo<BusStopContextValue>(() => ({
    availableStops: BUS_STOPS,
    selectedStops,
    setStopId,
  }), [selectedStops, setStopId]);

  return <BusStopContext.Provider value={value}>{children}</BusStopContext.Provider>;
}

export function useBusStopContext() {
  const context = useContext(BusStopContext);
  if (!context) {
    throw new Error("useBusStopContext must be used within BusStopProvider");
  }
  return context;
}
