"use client";

import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { WeatherLocationProvider } from "@/contexts/weather-location-context";
import { BusStopProvider } from "@/contexts/bus-stop-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <WeatherLocationProvider>
          <BusStopProvider>{children}</BusStopProvider>
        </WeatherLocationProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
