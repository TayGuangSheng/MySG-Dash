"use client";

import type { KeyboardEvent } from "react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/contexts/language-context";

const LOTTERY_SITES = [
  {
    id: "4d",
    icon: "\uD83C\uDFB2",
    labelKey: "dashboard.lotteryCard.fourDShort",
    url: "https://www.singaporepools.com.sg/en/product/Pages/4d_results.aspx",
  },
  {
    id: "toto",
    icon: "\uD83C\uDFAB",
    labelKey: "dashboard.lotteryCard.totoShort",
    url: "https://www.singaporepools.com.sg/en/product/Pages/toto_results.aspx",
  },
] as const;

export default function LotteryCard() {
  const { t } = useTranslation();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, url: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = url;
    }
  };

  const handleNavigate = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="grid h-full w-full grid-cols-2 gap-2">
      {LOTTERY_SITES.map((site) => (
        <Card
          key={site.id}
          role="button"
          tabIndex={0}
          aria-label={t(site.labelKey)}
          onClick={() => handleNavigate(site.url)}
          onKeyDown={(event) => handleKeyDown(event, site.url)}
          className="flex h-full min-h-[72px] w-full cursor-pointer flex-col justify-center gap-2 p-[clamp(12px,1vw,18px)] transition hover:shadow-[0_0_0_2px_rgba(255,255,255,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/80"
        >
          <span className="flex items-center gap-2 text-[clamp(18px,2vw,24px)] font-semibold text-white">
            <span aria-hidden="true">{site.icon}</span>
            {t(site.labelKey)}
          </span>
        </Card>
      ))}
    </div>
  );
}
