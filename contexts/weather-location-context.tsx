"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { PRESET_LOCATIONS, resolveLocation, serializeLocation, type WeatherLocationSelection } from "@/lib/locations";
import { useLocalStorage } from "@/hooks/use-local-storage";

const WEATHER_LOCATION_STORAGE_KEY = "doorboard.weatherLoc";

type WeatherLocationContextValue = {
  selection: WeatherLocationSelection;
  setSelection: (value: WeatherLocationSelection) => void;
  presets: typeof PRESET_LOCATIONS;
};

const WeatherLocationContext = createContext<WeatherLocationContextValue | undefined>(undefined);

export function WeatherLocationProvider({ children }: { children: React.ReactNode }) {
  const [rawValue, setRawValue] = useLocalStorage<string>(
    WEATHER_LOCATION_STORAGE_KEY,
    PRESET_LOCATIONS[0].id,
  );

  const selection = useMemo(() => resolveLocation(rawValue), [rawValue]);

  const setSelection = useCallback(
    (value: WeatherLocationSelection) => {
      setRawValue(serializeLocation(value));
    },
    [setRawValue],
  );

  const value = useMemo(
    () => ({
      selection,
      setSelection,
      presets: PRESET_LOCATIONS,
    }),
    [selection, setSelection],
  );

  return (
    <WeatherLocationContext.Provider value={value}>{children}</WeatherLocationContext.Provider>
  );
}

export function useWeatherLocation() {
  const ctx = useContext(WeatherLocationContext);
  if (!ctx) {
    throw new Error("useWeatherLocation must be used within WeatherLocationProvider");
  }
  return ctx;
}