# Performance Dashboard

Dark-mode performance marketing dashboard: Meta spend vs RedTrack-attributed revenue.
Built with Next.js (App Router), Tailwind CSS, Recharts and Supabase.

- **Date-range picker:** presets (yesterday, 7/14/30/90 days, month to date, last month) and a custom range. The range is kept in the URL (`?from=&to=`).
- **KPI cards:** Meta Spend, RedTrack Revenue, True ROAS, True CPA and Net Profit, each compared with the previous period of the same length, with a sparkline.
- **Trend chart:** daily Spend vs Revenue, Net Profit, True ROAS (with a 1.0x break-even line) and True CPA.
- **Campaign table:** grouped by campaign, expandable to ad level, searchable by campaign, ad name or ad ID, sortable on every column, with a totals row.

| Metric | Formula |
| --- | --- |
| True ROAS | `rt_revenue / meta_spend` |
| True CPA | `meta_spend / rt_conversions` |
| Net Profit | `rt_revenue - meta_spend` |

## Quick start (mock data, no database)

```bash
npm install
npm run dev
```

If no Supabase credentials are set, the app generates the mock dataset in memory (120 days ending yesterday) and shows a **Mock data** badge.

## Connect Supabase

1. In the Supabase SQL editor, run `supabase/migrations/0001_daily_ad_metrics.sql`.
2. Load the mock data with one of these:
   - paste `supabase/seed.sql` into the SQL editor (1,730 rows, Jul 31 to Nov 26, 2026), or
   - set the env vars below and run `npm run seed`. This upserts fresh data ending yesterday. Options: `--end YYYY-MM-DD`, `--days N`.
3. Copy `.env.example` to `.env.local` and fill in the values:

   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   ```

4. Run `npm run dev`. The badge switches to **Supabase**.

Only the server reads from Supabase (the page render and `/api/metrics`), so the key never reaches the browser. The table has RLS turned on and no policies, so the public anon key can't read it. Rows are fetched in pages of 1,000 to get past PostgREST's row cap.

## Layout

```
app/page.tsx               server render with the initial data
app/api/metrics/route.ts   GET ?from&to -> KPIs, previous period, daily trend, campaign/ad tree
components/                Dashboard, DateRangePicker, KpiCards, TrendChart, CampaignTable
lib/data-source.ts         Supabase queries, with a mock-data fallback
lib/metrics.ts             aggregation and derived metrics
lib/mock-data.ts           seeded generator for realistic data
scripts/seed.ts            seeds Supabase or writes supabase/seed.sql
supabase/                  migration and seed SQL
```

## About the mock data

The data comes from a seeded generator, so every run produces the same rows. It has 6 campaigns (Advantage+, lookalike, retargeting, interest TOF, a creative-testing ABO and a scaling CBO) and 23 ads. Each ad has its own CPM, CTR, conversion rate and AOV. The generator also models launch dates, ramp-up, creative fatigue, a weekend dip, test ads being cut, losing ads being paused, winners being scaled and higher late-November BFCM CPMs. The result is a realistic mix of profitable and unprofitable ads.
