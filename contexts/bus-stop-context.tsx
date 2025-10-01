"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BUS_STOPS } from "@/lib/config";

type BusStopOption = (typeof BUS_STOPS)[number];

export type BusStopSelection = {
  id: string;
  label: string;
  customName: string;
};

type BusStopSelections = [BusStopSelection, BusStopSelection];

type BusStopContextValue = {
  availableStops: readonly BusStopOption[];
  selectedStops: BusStopSelections;
  setStopId: (index: 0 | 1, stopId: string) => void;
  setStopCustomName: (index: 0 | 1, customName: string) => void;
};

const STORAGE_KEY = "sgdash.busStops";

const defaultStops: BusStopSelection[] = BUS_STOPS.slice(0, 2).map((stop) => ({
  id: stop.id,
  label: stop.label,
  customName: "",
}));

while (defaultStops.length < 2) {
  defaultStops.push({ id: "", label: "", customName: "" });
}

const DEFAULT_SELECTED_STOPS = defaultStops as BusStopSelections;

const BusStopContext = createContext<BusStopContextValue | undefined>(undefined);

function parseStoredStops(value: unknown): BusStopSelections | null {
  if (!Array.isArray(value) || value.length !== 2) {
    return null;
  }

  const mapped = value.map((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as Record<string, unknown>).id !== "string" ||
      typeof (item as Record<string, unknown>).label !== "string"
    ) {
      return null;
    }
    const id = ((item as Record<string, unknown>).id as string).trim();
    const label = ((item as Record<string, unknown>).label as string).trim();
    const customName = typeof (item as Record<string, unknown>).customName === "string"
      ? ((item as Record<string, unknown>).customName as string)
      : "";
    return { id, label, customName } satisfies BusStopSelection;
  });

  if (mapped.every((entry): entry is BusStopSelection => entry !== null)) {
    return mapped as BusStopSelections;
  }

  return null;
}

export function BusStopProvider({ children }: { children: React.ReactNode }) {
  const [selectedStops, setSelectedStops] = useState<BusStopSelections>(DEFAULT_SELECTED_STOPS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      const restored = parseStoredStops(parsed);
      if (restored) {
        setSelectedStops(restored);
      }
    } catch (error) {
      console.warn("Failed to restore bus stops from storage", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStops));
    } catch (error) {
      console.warn("Failed to persist bus stops", error);
    }
  }, [selectedStops]);

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
        customName: "",
      };

      const next: BusStopSelections = [...prev] as BusStopSelections;
      next[index] = replacement;
      return next;
    });
  }, []);

  const setStopCustomName = useCallback((index: 0 | 1, customName: string) => {
    setSelectedStops((prev) => {
      const next: BusStopSelections = [...prev] as BusStopSelections;
      next[index] = { ...next[index], customName };
      return next;
    });
  }, []);

  const value = useMemo<BusStopContextValue>(() => ({
    availableStops: BUS_STOPS,
    selectedStops,
    setStopId,
    setStopCustomName,
  }), [selectedStops, setStopId, setStopCustomName]);

  return <BusStopContext.Provider value={value}>{children}</BusStopContext.Provider>;
}

export function useBusStopContext() {
  const context = useContext(BusStopContext);
  if (!context) {
    throw new Error("useBusStopContext must be used within BusStopProvider");
  }
  return context;
}
