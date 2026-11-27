import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { addDays, previousPeriod, toIso } from "./dates";
import { campaignTree, dailyTrend, kpisFor } from "./metrics";
import { generateMockMetrics } from "./mock-data";
import type { DailyAdMetric, DashboardData, DateRange } from "./types";

const TABLE = "daily_ad_metrics";
const COLUMNS =
  "date, ad_id, campaign_name, ad_name, meta_spend, meta_impressions, meta_clicks, rt_conversions, rt_revenue";
const PAGE_SIZE = 1000; // PostgREST's default max-rows

let client: SupabaseClient | null | undefined;
function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

export const dataSource = () => (supabase() ? "supabase" : "mock") as DashboardData["source"];

// ---- mock mode -------------------------------------------------------------
let mockCache: { end: string; rows: DailyAdMetric[] } | null = null;
function mockRows() {
  const end = addDays(toIso(new Date()), -1); // data through yesterday
  if (mockCache?.end !== end) mockCache = { end, rows: generateMockMetrics(end) };
  return mockCache.rows;
}

// ---- queries ---------------------------------------------------------------
export async function getBounds(): Promise<DateRange | null> {
  const db = supabase();
  if (!db) {
    const rows = mockRows();
    if (!rows.length) return null;
    let from = rows[0].date;
    let to = rows[0].date;
    for (const r of rows) {
      if (r.date < from) from = r.date;
      if (r.date > to) to = r.date;
    }
    return { from, to };
  }
  const [first, last] = await Promise.all([
    db.from(TABLE).select("date").order("date", { ascending: true }).limit(1).maybeSingle(),
    db.from(TABLE).select("date").order("date", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (first.error) throw first.error;
  if (last.error) throw last.error;
  if (!first.data || !last.data) return null;
  return { from: first.data.date, to: last.data.date };
}

async function fetchRows(from: string, to: string): Promise<DailyAdMetric[]> {
  const db = supabase();
  if (!db) return mockRows().filter((r) => r.date >= from && r.date <= to);

  const rows: DailyAdMetric[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await db
      .from(TABLE)
      .select(COLUMNS)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true })
      .order("ad_id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data as DailyAdMetric[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

/** Resolves a requested range, falling back to the last 30 days of available data. */
export function resolveRange(bounds: DateRange | null, from?: string, to?: string): DateRange {
  const end = to ?? bounds?.to ?? addDays(toIso(new Date()), -1);
  const start = from ?? addDays(end, -29);
  return start <= end ? { from: start, to: end } : { from: end, to: start };
}

export async function getDashboardData(from?: string, to?: string): Promise<DashboardData> {
  const bounds = await getBounds();
  const range = resolveRange(bounds, from, to);
  const previousRange = previousPeriod(range.from, range.to);

  // One query covers both the selected and comparison periods.
  const rows = await fetchRows(previousRange.from, range.to);
  const current = rows.filter((r) => r.date >= range.from);
  const previous = rows.filter((r) => r.date < range.from);

  return {
    range,
    previousRange,
    bounds,
    source: dataSource(),
    kpis: kpisFor(current),
    previousKpis: kpisFor(previous),
    trend: dailyTrend(current, range.from, range.to),
    campaigns: campaignTree(current),
  };
}
