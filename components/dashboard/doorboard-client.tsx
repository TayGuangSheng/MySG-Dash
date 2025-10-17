"use client";

import BusStopCard from "@/components/dashboard/bus-stop-card";
import ClockCard from "@/components/dashboard/clock-card";
import MRTNetworkCard from "@/components/dashboard/mrt-network-card";
import LotteryCard from "@/components/dashboard/lottery-card";
import MemoriesCard from "@/components/dashboard/memories-card";
import SettingsCard from "@/components/dashboard/settings-card";
import WeatherCard from "@/components/dashboard/weather-card";
import { useBusStopContext, type BusStopSelection } from "@/contexts/bus-stop-context";
import { useTranslation } from "@/contexts/language-context";

export default function DoorboardClient() {
  const { selectedStops } = useBusStopContext();
  const { t } = useTranslation();
  const [firstStop, secondStop] = selectedStops;

  const resolveLabel = (stop: BusStopSelection) => {
    const custom = stop.customName.trim();
    if (custom) return custom;
    return t("dashboard.doorboard.busStopLabel", { label: stop.label });
  };

  return (
    <>
      <div className="grid h-full w-full grid-cols-12 auto-rows-[1fr] gap-2">
        <div className="col-span-12 xl:col-span-5 xl:row-span-2">
          <ClockCard />
        </div>
        <div className="col-span-12 xl:col-span-7 xl:row-span-2">
          <WeatherCard />
        </div>
        <div className="col-span-12 lg:col-span-2 xl:row-span-4 grid gap-2 xl:min-h-0" style={{ gridTemplateRows: "2fr repeat(3, minmax(0, 0.6fr))" }}>
          <div className="flex w-full xl:min-h-0"><MRTNetworkCard /></div>
          <div className="flex w-full xl:min-h-0"><LotteryCard /></div>
          <div className="flex w-full xl:min-h-0"><MemoriesCard /></div>
          <div className="flex w-full xl:min-h-0"><SettingsCard /></div>
        </div>
        <div className="col-span-12 lg:col-span-5 xl:row-span-4">
          <BusStopCard
            label={resolveLabel(firstStop)}
            stopId={firstStop.id}
          />
        </div>
        <div className="col-span-12 lg:col-span-5 xl:row-span-4">
          <BusStopCard
            label={resolveLabel(secondStop)}
            stopId={secondStop.id}
          />
        </div>
      </div>
    </>
  );
}

