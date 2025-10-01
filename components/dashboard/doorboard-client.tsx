"use client";

import BusStopCard from "@/components/dashboard/bus-stop-card";
import ClockCard from "@/components/dashboard/clock-card";
import MRTNetworkCard from "@/components/dashboard/mrt-network-card";
import SettingsOverlay from "@/components/dashboard/settings-overlay";
import WeatherCard from "@/components/dashboard/weather-card";
import { useBusStopContext } from "@/contexts/bus-stop-context";

export default function DoorboardClient() {
  const { selectedStops } = useBusStopContext();
  const [firstStop, secondStop] = selectedStops;

  return (
    <>
      <SettingsOverlay />
      <div className="grid h-full w-full grid-cols-12 auto-rows-[1fr] gap-2">
        <div className="col-span-12 xl:col-span-5 xl:row-span-2">
          <ClockCard />
        </div>
        <div className="col-span-12 xl:col-span-7 xl:row-span-2">
          <WeatherCard />
        </div>
        <div className="col-span-12 lg:col-span-2 xl:row-span-4">
          <MRTNetworkCard />
        </div>
        <div className="col-span-12 lg:col-span-5 xl:row-span-4">
          <BusStopCard
            label={`Bus Stop ${firstStop.label}`}
            stopId={firstStop.id}
          />
        </div>
        <div className="col-span-12 lg:col-span-5 xl:row-span-4">
          <BusStopCard
            label={`Bus Stop ${secondStop.label}`}
            stopId={secondStop.id}
          />
        </div>
      </div>
    </>
  );
}
