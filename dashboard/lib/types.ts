export interface DailyAdMetric {
  date: string; // YYYY-MM-DD
  ad_id: string;
  campaign_name: string;
  ad_name: string;
  meta_spend: number;
  meta_impressions: number;
  meta_clicks: number;
  rt_conversions: number;
  rt_revenue: number;
}

export interface Totals {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface Kpis extends Totals {
  roas: number | null;
  cpa: number | null;
  profit: number;
  ctr: number | null;
  cpc: number | null;
}

export interface TrendPoint extends Kpis {
  date: string;
}

export interface AdRow extends Kpis {
  adId: string;
  adName: string;
}

export interface CampaignRow extends Kpis {
  campaignName: string;
  ads: AdRow[];
}

export interface DateRange {
  from: string;
  to: string;
}

export interface DashboardData {
  range: DateRange;
  previousRange: DateRange;
  bounds: DateRange | null;
  source: "supabase" | "mock";
  kpis: Kpis;
  previousKpis: Kpis;
  trend: TrendPoint[];
  campaigns: CampaignRow[];
}
