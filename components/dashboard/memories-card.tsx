"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/contexts/language-context";

type MemoryItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  image?: string;
};

const SAMPLE_MEMORIES: MemoryItem[] = [
  {
    id: "grandkids-birthday",
    title: "Grandkids Birthday",
    description: "Candles, cake, and a very happy six-year-old. Photos from last weekend's celebration.",
    date: "2025-09-28",
    image: "/memories/grandkids-birthday.jpg",
  },
  {
    id: "morning-walk",
    title: "Morning Walk",
    description: "A breezy stroll at Bishan Park with coffee afterwards.",
    date: "2025-09-15",
    image: "/memories/morning-walk.jpg",
  },
  {
    id: "family-message",
    title: "Message from Mei",
    description: "â€œWeâ€™ll visit this Sunday! Call us if you need groceries.â€",
    date: "2025-10-10",
  },
];

export default function MemoriesCard() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleActivate = () => setOpen(true);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        className="flex h-full min-h-[72px] w-full cursor-pointer flex-col justify-center gap-1.5 p-[clamp(12px,1vw,18px)] transition hover:shadow-[0_0_0_2px_rgba(255,255,255,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/80"
        aria-label={t("dashboard.memoriesCard.title")}
      >
        <span className="flex items-center gap-2 text-[clamp(16px,2vw,24px)] font-semibold text-white">
          <span aria-hidden="true">{"\uD83D\uDCF7"}</span>
          {t("dashboard.memoriesCard.title")}
        </span>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="memories-dialog-title"
            className="relative flex w-[min(100%,720px)] max-h-[92vh] flex-col gap-5 overflow-hidden rounded-3xl border border-white/15 bg-black/85 p-6 text-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 id="memories-dialog-title" className="text-[clamp(18px,2.1vw,28px)] font-semibold">
                  {t("dashboard.memoriesCard.modalTitle")}
                </h2>
                <p className="text-[clamp(11px,1.2vw,14px)] text-white/70">
                  {t("dashboard.memoriesCard.modalSubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/80 transition hover:border-white/60 hover:text-white"
              >
                {t("common.actions.close")}
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {SAMPLE_MEMORIES.map((memory) => (
                <article
                  key={memory.id}
                  className="flex gap-4 rounded-2xl border border-white/12 bg-white/5 p-4 shadow-inner"
                >
                  <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-white/10">
                    {memory.image ? (
                      <Image
                        src={memory.image}
                        alt={memory.title}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-white/60">
                        {t("dashboard.memoriesCard.placeholder")}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-[clamp(13px,1.3vw,18px)] font-semibold text-white">
                      {memory.title}
                    </h3>
                    <p className="text-[clamp(11px,1.2vw,14px)] text-white/75">
                      {memory.description}
                    </p>
                    <p className="text-[clamp(10px,1vw,12px)] text-white/50">
                      {t("dashboard.memoriesCard.seenOn", { date: memory.date })}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <footer className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-[clamp(11px,1.1vw,14px)] text-white/70">
              {t("dashboard.memoriesCard.hint")}
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
