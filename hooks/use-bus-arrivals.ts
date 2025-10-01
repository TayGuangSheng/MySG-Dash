"use client";

import useSWR from "swr";
import { REFRESH_INTERVALS } from "@/lib/config";
import { jsonFetcher } from "@/lib/fetcher";
import type { BusApiResponse } from "@/types/api";

export function useBusArrivals(stopCode: string) {
  const query = new URLSearchParams({ stop: stopCode });
  const { data, error, isLoading, mutate } = useSWR<BusApiResponse>(
    `/api/bus?${query.toString()}`,
    jsonFetcher,
    {
      refreshInterval: REFRESH_INTERVALS.bus,
      revalidateOnFocus: false,
    },
  );

  return {
    arrivals: data,
    isLoading,
    error,
    refresh: mutate,
  };
}