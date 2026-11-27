"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardData, DateRange } from "@/lib/types";
import { rangeLabel } from "@/lib/dates";
import DateRangePicker from "./DateRangePicker";
import KpiCards from "./KpiCards";
import TrendChart from "./TrendChart";
import CampaignTable from "./CampaignTable";

export default function Dashboard({ initial }: { initial: DashboardData }) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  const load = useCallback(async (range: DateRange) => {
    request.current?.abort();
    const ctrl = (request.current = new AbortController());
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ from: range.from, to: range.to });
      const res = await fetch(`/api/metrics?${qs}`, { signal: ctrl.signal });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      setData(body as DashboardData);
      window.history.replaceState(null, "", `?${qs}`);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      if (request.current === ctrl) setLoading(false);
    }
  }, []);

  useEffect(() => () => request.current?.abort(), []);

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Performance</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Meta spend vs RedTrack-attributed revenue · compared with {rangeLabel(data.previousRange.from, data.previousRange.to)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SourceBadge source={data.source} />
          <DateRangePicker value={data.range} bounds={data.bounds} onChange={load} disabled={loading} />
        </div>
      </header>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
          {error}
        </div>
      )}

      <div className={`transition-opacity duration-200 ${loading ? "pointer-events-none opacity-50" : ""}`} aria-busy={loading}>
        <KpiCards current={data.kpis} previous={data.previousKpis} trend={data.trend} />
        <TrendChart trend={data.trend} />
        <CampaignTable campaigns={data.campaigns} />
      </div>
    </main>
  );
}

function SourceBadge({ source }: { source: DashboardData["source"] }) {
  const live = source === "supabase";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-muted"
      title={live ? "Reading from Supabase: daily_ad_metrics" : "No Supabase credentials set — showing generated mock data"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-good" : "bg-[#d28e05]"}`} aria-hidden />
      {live ? "Supabase" : "Mock data"}
    </span>
  );
}
