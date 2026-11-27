import { eachDay } from "./dates";
import type { AdRow, CampaignRow, DailyAdMetric, Kpis, Totals, TrendPoint } from "./types";

export const emptyTotals = (): Totals => ({ spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });

export function addRow(t: Totals, r: DailyAdMetric): Totals {
  // Supabase returns numeric columns as strings; coerce defensively.
  t.spend += Number(r.meta_spend);
  t.impressions += Number(r.meta_impressions);
  t.clicks += Number(r.meta_clicks);
  t.conversions += Number(r.rt_conversions);
  t.revenue += Number(r.rt_revenue);
  return t;
}

export function sumTotals(items: Totals[]): Totals {
  const t = emptyTotals();
  for (const i of items) {
    t.spend += i.spend;
    t.impressions += i.impressions;
    t.clicks += i.clicks;
    t.conversions += i.conversions;
    t.revenue += i.revenue;
  }
  return t;
}

/** Derived ratios. "True" = Meta spend measured against RedTrack-attributed results. */
export function derive(t: Totals): Kpis {
  return {
    ...t,
    roas: t.spend > 0 ? t.revenue / t.spend : null,
    cpa: t.conversions > 0 ? t.spend / t.conversions : null,
    profit: t.revenue - t.spend,
    ctr: t.impressions > 0 ? t.clicks / t.impressions : null,
    cpc: t.clicks > 0 ? t.spend / t.clicks : null,
  };
}

export function kpisFor(rows: DailyAdMetric[]): Kpis {
  const t = emptyTotals();
  for (const r of rows) addRow(t, r);
  return derive(t);
}

export function dailyTrend(rows: DailyAdMetric[], from: string, to: string): TrendPoint[] {
  const byDay = new Map<string, ReturnType<typeof emptyTotals>>(eachDay(from, to).map((d) => [d, emptyTotals()]));
  for (const r of rows) {
    const t = byDay.get(r.date);
    if (t) addRow(t, r);
  }
  return [...byDay].map(([date, t]) => ({ date, ...derive(t) }));
}

export function campaignTree(rows: DailyAdMetric[]): CampaignRow[] {
  const campaigns = new Map<string, Map<string, { name: string; t: Totals }>>();
  for (const r of rows) {
    let ads = campaigns.get(r.campaign_name);
    if (!ads) campaigns.set(r.campaign_name, (ads = new Map()));
    let ad = ads.get(r.ad_id);
    if (!ad) ads.set(r.ad_id, (ad = { name: r.ad_name, t: emptyTotals() }));
    addRow(ad.t, r);
  }
  return [...campaigns]
    .map(([campaignName, ads]) => {
      const adRows: AdRow[] = [...ads].map(([adId, a]) => ({ adId, adName: a.name, ...derive(a.t) }));
      adRows.sort((a, b) => b.spend - a.spend);
      return { campaignName, ads: adRows, ...derive(sumTotals(adRows)) };
    })
    .sort((a, b) => b.spend - a.spend);
}
