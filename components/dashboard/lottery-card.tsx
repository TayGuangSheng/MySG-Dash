"use client";

import { useState, type KeyboardEvent } from "react";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { useTranslation } from "@/contexts/language-context";

const RESULTS_URL = "https://www.singaporepools.com.sg/en/product/Pages/4d_results.aspx";

export default function LotteryCard() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleActivate = () => {
    setOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate();
    }
  };

  const handleNavigate = () => {
    window.location.href = RESULTS_URL;
  };

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        className="flex h-full min-h-[72px] w-full cursor-pointer flex-col items-start justify-center gap-1.5 p-[clamp(12px,1vw,18px)] transition hover:shadow-[0_0_0_2px_rgba(255,255,255,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/80"
        aria-label={t("dashboard.lotteryCard.title")}
      >
        <span className="flex items-center gap-2 text-[clamp(16px,2vw,24px)] font-semibold text-white">
          <span aria-hidden="true">{"\uD83C\uDFB2"}</span>
          {t("dashboard.lotteryCard.title")}
        </span>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lottery-dialog-title"
            className="relative flex w-[min(100%,640px)] flex-col gap-6 overflow-hidden rounded-3xl border border-white/15 bg-black/85 p-6 text-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4">
              <h2 id="lottery-dialog-title" className="text-[clamp(18px,2.2vw,28px)] font-semibold text-white">
                {t("dashboard.lotteryCard.modalTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/80 transition hover:border-white/60 hover:text-white"
              >
                {t("common.actions.close")}
              </button>
            </header>
            <div className="space-y-4 text-[clamp(13px,1.5vw,18px)] text-white/80">
              <p>{t("dashboard.lotteryCard.modalBody")}</p>
              <p className="text-[clamp(12px,1.4vw,16px)] text-white/60">
                {RESULTS_URL}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/25 px-4 py-2 text-[clamp(11px,1.2vw,14px)] text-white/80 transition hover:border-white/50 hover:text-white"
              >
                {t("dashboard.lotteryCard.stayHere")}
              </button>
              <button
                type="button"
                onClick={handleNavigate}
                className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-[clamp(11px,1.2vw,14px)] font-semibold text-white transition hover:border-white/60 hover:bg-white/15"
              >
                {t("dashboard.lotteryCard.openSite")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

