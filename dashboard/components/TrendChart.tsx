"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { longDate, shortDate } from "@/lib/dates";
import { compactMoney, money, moneyCents, roas } from "@/lib/format";
import type { TrendPoint } from "@/lib/types";

// Dark-mode categorical slots (validated palette): 1 blue, 2 orange, 3 aqua.
const BLUE = "#338ced";
const ORANGE = "#e76624";
const AQUA = "#00a888";
const GRID = "#2a2d33";
const AXIS = "#474747";
const TICK = "#9c9c9c";

interface Series {
  key: keyof TrendPoint;
  name: string;
  color: string;
}

interface View {
  id: string;
  label: string;
  series: Series[];
  axis: (n: number) => string;
  value: (n: number | null) => string;
  reference?: { y: number; label: string };
}

const VIEWS: View[] = [
  {
    id: "spend-revenue",
    label: "Spend vs Revenue",
    series: [
      { key: "spend", name: "Meta Spend", color: BLUE },
      { key: "revenue", name: "RedTrack Revenue", color: ORANGE },
    ],
    axis: compactMoney,
    value: money,
  },
  {
    id: "profit",
    label: "Net Profit",
    series: [{ key: "profit", name: "Net Profit", color: AQUA }],
    axis: compactMoney,
    value: money,
    reference: { y: 0, label: "Break-even" },
  },
  {
    id: "roas",
    label: "True ROAS",
    series: [{ key: "roas", name: "True ROAS", color: BLUE }],
    axis: (n) => `${n.toFixed(1)}x`,
    value: roas,
    reference: { y: 1, label: "Break-even 1.0x" },
  },
  {
    id: "cpa",
    label: "True CPA",
    series: [{ key: "cpa", name: "True CPA", color: BLUE }],
    axis: (n) => `$${Math.round(n)}`,
    value: moneyCents,
  },
];

export default function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const [viewId, setViewId] = useState(VIEWS[0].id);
  const view = VIEWS.find((v) => v.id === viewId)!;
  const single = view.series.length === 1;

  return (
    <section aria-labelledby="trend-title" className="mt-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="trend-title" className="text-sm font-semibold">
            Daily trend{single ? ` · ${view.series[0].name}` : ""}
          </h2>
          {!single && (
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted" aria-label="Legend">
              {view.series.map((s) => (
                <li key={s.key} className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3.5 rounded-full" style={{ background: s.color }} aria-hidden />
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div role="tablist" aria-label="Trend metric" className="flex max-w-full overflow-x-auto rounded-lg border border-line bg-page p-0.5 text-xs">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              role="tab"
              type="button"
              aria-selected={v.id === viewId}
              onClick={() => setViewId(v.id)}
              className={`whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                v.id === viewId ? "bg-surface-hover text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-[300px] sm:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              interval="preserveStartEnd"
              tick={{ fill: TICK, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: AXIS }}
              tickMargin={8}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={view.axis}
              tick={{ fill: TICK, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
              domain={view.id === "roas" ? [0, "auto"] : ["auto", "auto"]}
            />
            {view.reference && (
              <ReferenceLine
                y={view.reference.y}
                stroke="#6b6e74"
                strokeDasharray="4 4"
                label={{ value: view.reference.label, position: "insideTopLeft", fill: TICK, fontSize: 11 }}
              />
            )}
            <Tooltip
              cursor={{ stroke: "#6b6e74", strokeWidth: 1 }}
              content={(props) => <TrendTooltip {...props} view={view} />}
              isAnimationActive={false}
            />
            {view.series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4.5, stroke: "#16181c", strokeWidth: 2 }}
                connectNulls
                animationDuration={400}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TrendTooltip({ active, payload, label, view }: TooltipContentProps<ValueType, NameType> & { view: View }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as TrendPoint;
  return (
    <div className="min-w-[180px] rounded-lg border border-line-strong bg-surface-raised px-3 py-2.5 text-xs shadow-xl shadow-black/50">
      <p className="mb-1.5 font-medium text-ink">{longDate(String(label))}</p>
      {view.series.map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.name}
          </span>
          <span className="font-medium text-ink tabular">{view.value(point[s.key] as number | null)}</span>
        </div>
      ))}
      <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 border-t border-line pt-1.5 text-ink-muted">
        {view.id !== "roas" && <Stat label="ROAS" value={roas(point.roas)} />}
        {view.id !== "cpa" && <Stat label="CPA" value={moneyCents(point.cpa)} />}
        {view.id !== "profit" && <Stat label="Profit" value={money(point.profit)} />}
        <Stat label="Conv." value={String(point.conversions)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span>{label}</span>
      <span className="text-right text-ink tabular">{value}</span>
    </>
  );
}
