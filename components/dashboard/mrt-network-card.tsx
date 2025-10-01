"use client";

import { Card } from "@/components/ui/card";
import { useTrainStatus } from "@/hooks/use-train-status";
import type { TrainStatus } from "@/types/api";

const LINES = [
	{ id: "NSL", label: "North South", color: "#d42d1f" },
	{ id: "EWL", label: "East West", color: "#009645" },
	{ id: "NEL", label: "North East", color: "#9900aa" },
	{ id: "CCL", label: "Circle", color: "#fa9e0d" },
	{ id: "DTL", label: "Downtown", color: "#005ec4" },
	{ id: "TEL", label: "Thomson-East Coast", color: "#784942" },
] as const;

export default function MRTNetworkCard() {
	const { status, isLoading, error } = useTrainStatus();
	const byLine = new Map(status?.lines.map((line) => [line.line, line]));

	return (
		<Card className="flex flex-col gap-[clamp(16px,1.4vw,24px)] p-[clamp(20px,1.8vw,32px)]">
			<header className="flex min-w-0 flex-col gap-[clamp(4px,0.6vw,8px)]">
				<span className="text-[clamp(16px,2vw,24px)] font-semibold text-white">
					MRT network
				</span>
				<span className="text-[clamp(10px,1.2vw,14px)] font-normal text-white/70">
					Updated{" "}
					{status?.updatedAt ? formatUpdated(status.updatedAt) : "--:--"}
				</span>
			</header>

			<section className="grid h-full min-h-0 grid-cols-1 gap-[clamp(10px,1vw,16px)] auto-rows-[minmax(90px,1fr)] md:grid-cols-2">
				{LINES.map((line) => {
					const record = byLine.get(line.id);
					return (
						<LineTile
							key={line.id}
							label={line.label}
							line={line.id}
							color={line.color}
							status={record?.status ?? "Normal"}
							note={record?.note}
						/>
					);
				})}
			</section>
		</Card>
	);
}

type LineTileProps = {
	label: string;
	line: string;
	color: string;
	status: TrainStatus;
	note?: string;
};

function LineTile({ label, line, color, status, note }: LineTileProps) {
	return (
		<article className="grid min-h-0 grid-rows-[auto_auto_auto_1fr] gap-[clamp(4px,0.5vw,8px)] rounded-xl border border-white/12 bg-white/5 px-[clamp(8px,1vw,14px)] py-[clamp(8px,1vw,12px)] shadow-inner">
			<div className="flex items-center justify-between gap-2">
				<span className="text-[clamp(8px,1vw,12px)] font-semibold uppercase tracking-[0.2em] text-white/70">
					{line}
				</span>
				<span
					className="h-1 w-[45%] min-w-[60px] rounded-full"
					style={{ background: color }}
					aria-hidden
				/>
			</div>
			<h3 className="text-[clamp(10px,1.2vw,14px)] font-semibold text-white">
				{label}
			</h3>
			<p
				className={`text-[clamp(10px,1.2vw,14px)] font-semibold ${statusColor(
					status
				)}`}
			>
				{status}
			</p>
			{note ? (
				<p className="text-[clamp(8px,1vw,12px)] text-white/70">{note}</p>
			) : (
				<div className="min-h-[1px]" />
			)}
		</article>
	);
}

function statusColor(status: TrainStatus) {
	switch (status) {
		case "Normal":
			return "text-emerald-300";
		case "Delay":
			return "text-amber-300";
		case "Disrupted":
			return "text-rose-300";
		default:
			return "text-white";
	}
}

function formatUpdated(iso: string) {
	const date = new Date(iso);
	return new Intl.DateTimeFormat("en-SG", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: "Asia/Singapore",
	}).format(date);
}
