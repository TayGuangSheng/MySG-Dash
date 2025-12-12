"use client";

import BusStopCard from "@/components/dashboard/bus-stop-card";
import ClockCard from "@/components/dashboard/clock-card";
import MRTNetworkCard from "@/components/dashboard/mrt-network-card";
import LotteryCard from "@/components/dashboard/lottery-card";
import FocusCard from "@/components/dashboard/focus-card";
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
      <div className="grid w-full grid-cols-1 gap-2 xl:h-full xl:grid-cols-12 xl:auto-rows-[1fr]">
        <div className="col-span-1 xl:col-span-5 xl:row-span-2">
          <ClockCard />
        </div>
        <div className="col-span-1 xl:col-span-7 xl:row-span-2">
          <WeatherCard />
        </div>
        <div className="col-span-1 xl:col-span-2 xl:row-span-4 grid gap-2 xl:min-h-0">
          <div className="flex w-full xl:min-h-0"><MRTNetworkCard /></div>
          <div className="flex w-full xl:min-h-0"><LotteryCard /></div>
          <div className="flex w-full xl:min-h-0"><FocusCard /></div>
          <div className="flex w-full xl:min-h-0"><SettingsCard /></div>
        </div>
        <div className="col-span-1 xl:col-span-5 xl:row-span-4">
          <BusStopCard
            label={resolveLabel(firstStop)}
            stopId={firstStop.id}
          />
        </div>
        <div className="col-span-1 xl:col-span-5 xl:row-span-4">
          <BusStopCard
            label={resolveLabel(secondStop)}
            stopId={secondStop.id}
          />
        </div>
      </div>
    </>
  );
}
