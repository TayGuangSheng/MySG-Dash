"use client";

import SpotifyPlayer from "@/components/dashboard/SpotifyPlayer";
import { Card } from "@/components/ui/card";

export default function SpotifyCard() {
  return (
    <Card className="flex h-full min-h-0 flex-col gap-[clamp(10px,1vw,16px)] overflow-hidden p-[clamp(16px,1.5vw,28px)]">
      <header className="flex min-w-0 flex-col gap-[clamp(4px,0.6vw,8px)]">
        <span className="text-[clamp(16px,2vw,22px)] font-semibold text-white">Spotify</span>
        <span className="truncate text-[clamp(10px,1.1vw,14px)] text-white/70">
          Manage playback without leaving the dashboard.
        </span>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto pr-1">
          <SpotifyPlayer />
        </div>
      </div>
    </Card>
  );
}