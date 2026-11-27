-- Daily ad-level performance: Meta delivery joined with RedTrack attribution.
create table if not exists public.daily_ad_metrics (
  date              date           not null,
  ad_id             text           not null,
  campaign_name     text           not null,
  ad_name           text           not null,
  meta_spend        numeric(12, 2) not null default 0,
  meta_impressions  bigint         not null default 0,
  meta_clicks       integer        not null default 0,
  rt_conversions    integer        not null default 0,
  rt_revenue        numeric(12, 2) not null default 0,
  primary key (date, ad_id)
);

create index if not exists daily_ad_metrics_date_idx on public.daily_ad_metrics (date);
create index if not exists daily_ad_metrics_campaign_idx on public.daily_ad_metrics (campaign_name);

-- The dashboard reads with the service-role key on the server, which bypasses RLS.
-- RLS stays on with no policies so the public anon key cannot read spend/revenue.
alter table public.daily_ad_metrics enable row level security;
