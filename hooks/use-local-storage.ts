"use client";

import { useCallback, useEffect, useState } from "react";

const memoryStore = new Map<string, unknown>();

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`Failed to read localStorage key "${key}":`, error);
      return (memoryStore.get(key) as T | undefined) ?? defaultValue;
    }
  });

  const persist = useCallback(
    (next: T) => {
      setValue(next);
      memoryStore.set(key, next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch (error) {
        console.warn(`Failed to persist localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      try {
        const parsed = event.newValue ? (JSON.parse(event.newValue) as T) : defaultValue;
        setValue(parsed);
        memoryStore.set(key, parsed);
      } catch (error) {
        console.warn(`Failed to parse storage event for key "${key}":`, error);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [defaultValue, key]);

  return [value, persist] as const;
}