"use client";

import useSWR from "swr";
import { REFRESH_INTERVALS } from "@/lib/config";
import { jsonFetcher } from "@/lib/fetcher";
import type { TrainApiResponse } from "@/types/api";

const DEFAULT_LINES = ["NSL", "EWL", "NEL", "CCL", "DTL", "TEL"] as const;

export function useTrainStatus(lines = DEFAULT_LINES) {
  const query = new URLSearchParams({ line: lines.join("|") });
  const { data, error, isLoading, mutate } = useSWR<TrainApiResponse>(
    `/api/train?${query.toString()}`,
    jsonFetcher,
    {
      refreshInterval: REFRESH_INTERVALS.trains,
      revalidateOnFocus: false,
    },
  );

  return {
    status: data,
    isLoading,
    error,
    refresh: mutate,
  };
}