"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { money, moneyCents, roas } from "@/lib/format";
import type { Kpis, TrendPoint } from "@/lib/types";

type Direction = "up" | "down" | "neutral"; // which way is "good"

interface CardDef {
  key: "spend" | "revenue" | "roas" | "cpa" | "profit";
  label: string;
  hint: string;
  format: (n: number | null) => string;
  good: Direction;
  /** Show the change as an absolute value instead of a % (for numbers that can cross zero). */
  absolute?: boolean;
}

const CARDS: CardDef[] = [
  { key: "spend", label: "Meta Spend", hint: "Amount spent in Meta Ads Manager", format: money, good: "neutral" },
  { key: "revenue", label: "RedTrack Revenue", hint: "Revenue attributed by RedTrack", format: money, good: "up" },
  { key: "roas", label: "True ROAS", hint: "RedTrack revenue ÷ Meta spend", format: roas, good: "up" },
  { key: "cpa", label: "True CPA", hint: "Meta spend ÷ RedTrack conversions", format: moneyCents, good: "down" },
  { key: "profit", label: "Net Profit", hint: "RedTrack revenue − Meta spend", format: money, good: "up", absolute: true },
];

export default function KpiCards({ current, previous, trend }: { current: Kpis; previous: Kpis; trend: TrendPoint[] }) {
  return (
    <section aria-label="Key metrics" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {CARDS.map((c) => (
        <KpiCard key={c.key} def={c} value={current[c.key]} prev={previous[c.key]} trend={trend} />
      ))}
    </section>
  );
}

function KpiCard({ def, value, prev, trend }: { def: CardDef; value: number | null; prev: number | null; trend: TrendPoint[] }) {
  const delta = value != null && prev != null ? value - prev : null;
  const rel = delta != null && prev ? delta / Math.abs(prev) : null;
  const shown = def.absolute ? delta : rel;
  const isNeg = def.key === "profit" && value != null && value < 0;

  let tone = "text-ink-muted";
  if (shown != null && Math.abs(def.absolute ? (rel ?? 1) : shown) >= 0.001 && def.good !== "neutral") {
    const improved = def.good === "up" ? shown > 0 : shown < 0;
    tone = improved ? "text-good" : "text-bad";
  }

  const deltaText =
    shown == null
      ? "No prior data"
      : def.absolute
        ? `${shown >= 0 ? "+" : "−"}${money(Math.abs(shown))}`
        : `${shown >= 0 ? "+" : "−"}${Math.abs(shown * 100).toFixed(1)}%`;

  return (
    <article className="group relative flex flex-col rounded-xl border border-line bg-surface p-4 last:col-span-2 md:last:col-span-1" title={def.hint}>
      <h2 className="text-[13px] font-medium text-ink-muted">{def.label}</h2>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight sm:text-[28px] ${isNeg ? "text-bad" : ""}`}>{def.format(value)}</p>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {shown != null && shown !== 0 && (
          <span className={tone} aria-hidden>
            {shown > 0 ? "▲" : "▼"}
          </span>
        )}
        <span className={`${tone} tabular`}>{deltaText}</span>
        {shown != null && <span className="text-ink-faint">vs {def.format(prev)}</span>}
      </div>
      <div className="mt-3 h-10" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Line
              type="monotone"
              dataKey={def.key}
              stroke="#338ced"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
