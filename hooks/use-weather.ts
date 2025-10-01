"use client";

import useSWR from "swr";
import { REFRESH_INTERVALS } from "@/lib/config";
import { jsonFetcher } from "@/lib/fetcher";
import type { WeatherLocationSelection } from "@/lib/locations";
import type { WeatherApiResponse } from "@/types/api";

export function useWeather(selection: WeatherLocationSelection) {
  const query =
    selection.type === "preset"
      ? new URLSearchParams({ near: selection.location.id })
      : new URLSearchParams({ lat: String(selection.lat), lon: String(selection.lon) });

  const { data, error, isLoading, mutate } = useSWR<WeatherApiResponse>(
    `/api/weather?${query.toString()}`,
    jsonFetcher,
    {
      refreshInterval: REFRESH_INTERVALS.weather,
      revalidateOnFocus: false,
    },
  );

  return {
    weather: data,
    isLoading,
    error,
    refresh: mutate,
  };
}