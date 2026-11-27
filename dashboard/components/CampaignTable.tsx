"use client";

import { Fragment, useMemo, useState } from "react";
import { derive, sumTotals } from "@/lib/metrics";
import { money, moneyCents, number, pct, roas } from "@/lib/format";
import type { AdRow, CampaignRow, Kpis } from "@/lib/types";

type SortKey = "name" | "spend" | "impressions" | "clicks" | "ctr" | "cpc" | "conversions" | "revenue" | "roas" | "cpa" | "profit";

const COLUMNS: { key: Exclude<SortKey, "name">; label: string; render: (r: Kpis) => React.ReactNode }[] = [
  { key: "spend", label: "Spend", render: (r) => money(r.spend) },
  { key: "impressions", label: "Impr.", render: (r) => number(r.impressions) },
  { key: "clicks", label: "Clicks", render: (r) => number(r.clicks) },
  { key: "ctr", label: "CTR", render: (r) => pct(r.ctr) },
  { key: "cpc", label: "CPC", render: (r) => moneyCents(r.cpc) },
  { key: "conversions", label: "Conv.", render: (r) => number(r.conversions) },
  { key: "revenue", label: "Revenue", render: (r) => money(r.revenue) },
  { key: "roas", label: "ROAS", render: (r) => <RoasCell value={r.roas} /> },
  { key: "cpa", label: "CPA", render: (r) => moneyCents(r.cpa) },
  {
    key: "profit",
    label: "Net Profit",
    render: (r) => <span className={r.profit < 0 ? "text-bad" : ""}>{r.profit < 0 ? `−${money(-r.profit)}` : money(r.profit)}</span>,
  },
];

const sortValue = (r: Kpis & { campaignName?: string; adName?: string }, key: SortKey) =>
  key === "name" ? (r.campaignName ?? r.adName ?? "").toLowerCase() : r[key];

function compare(key: SortKey, dir: 1 | -1) {
  return (a: Kpis, b: Kpis) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1; // nulls (e.g. CPA with 0 conversions) always last
    if (bv == null) return -1;
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
  };
}

export default function CampaignTable({ campaigns }: { campaigns: CampaignRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "spend", dir: -1 });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();
  const rows = useMemo(() => {
    const cmp = compare(sort.key, sort.dir);
    const filtered: CampaignRow[] = [];
    for (const c of campaigns) {
      const campaignHit = !q || c.campaignName.toLowerCase().includes(q);
      const ads = campaignHit ? c.ads : c.ads.filter((a) => a.adName.toLowerCase().includes(q) || a.adId.includes(q));
      if (!ads.length) continue;
      // When only some ads match, the campaign row shows the subtotal of the matching ads.
      const base = ads.length === c.ads.length ? c : { ...c, ...derive(sumTotals(ads)) };
      filtered.push({ ...base, ads: [...ads].sort(cmp) });
    }
    return filtered.sort(cmp);
  }, [campaigns, q, sort]);

  const totals = useMemo(() => derive(sumTotals(rows)), [rows]);
  const adCount = rows.reduce((n, c) => n + c.ads.length, 0);
  const allOpen = rows.length > 0 && rows.every((c) => expanded.has(c.campaignName));
  const isOpen = (name: string) => !!q || expanded.has(name);

  const toggle = (name: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" || key === "cpa" ? 1 : -1 }));

  return (
    <section aria-labelledby="table-title" className="mt-4 rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:px-5">
        <div>
          <h2 id="table-title" className="text-sm font-semibold">
            Campaigns &amp; ads
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {rows.length} campaign{rows.length === 1 ? "" : "s"} · {adCount} ad{adCount === 1 ? "" : "s"}
            {q && " matching"}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="relative flex-1 sm:w-72 sm:flex-none">
            <span className="sr-only">Search campaigns and ads</span>
            <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" width="14" height="14" viewBox="0 0 16 16" aria-hidden>
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" fill="none" />
              <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaign, ad name or ID…"
              className="w-full rounded-lg border border-line-strong bg-page py-2 pl-8 pr-3 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
          </label>
          <button
            type="button"
            disabled={!!q}
            onClick={() => setExpanded(allOpen ? new Set() : new Set(rows.map((c) => c.campaignName)))}
            className="whitespace-nowrap rounded-lg border border-line-strong px-3 py-2 text-xs font-medium text-ink-muted hover:bg-surface-hover hover:text-ink disabled:opacity-40"
          >
            {allOpen || q ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-sm tabular">
          <thead>
            <tr className="text-xs text-ink-muted">
              <Th sortKey="name" sort={sort} onSort={onSort} align="left" sticky>
                Campaign / Ad name
              </Th>
              {COLUMNS.map((c) => (
                <Th key={c.key} sortKey={c.key} sort={sort} onSort={onSort}>
                  {c.label}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-5 py-12 text-center text-ink-muted">
                  {q ? <>No campaigns or ads match “{query}”.</> : "No data for this date range."}
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const open = isOpen(c.campaignName);
              return (
                <Fragment key={c.campaignName}>
                  <tr className="border-t border-line hover:bg-white/[0.025]">
                    <td className="sticky left-0 z-10 max-w-[220px] sm:max-w-[360px] bg-surface px-4 py-2.5 sm:px-5">
                      <button
                        type="button"
                        onClick={() => toggle(c.campaignName)}
                        disabled={!!q}
                        aria-expanded={open}
                        className="flex w-full items-center gap-2 text-left font-medium disabled:cursor-default"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          aria-hidden
                          className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-90" : ""}`}
                        >
                          <path d="M4.5 3 7.5 6 4.5 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        </svg>
                        <span className="truncate" title={c.campaignName}>
                          <Highlight text={c.campaignName} q={q} />
                        </span>
                        <span className="ml-1 shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-normal text-ink-muted">
                          {c.ads.length}
                        </span>
                      </button>
                    </td>
                    {COLUMNS.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
                        {col.render(c)}
                      </td>
                    ))}
                  </tr>
                  {open && c.ads.map((a) => <AdTableRow key={a.adId} ad={a} q={q} />)}
                </Fragment>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-line-strong bg-surface-raised font-semibold">
                <td className="sticky left-0 z-10 bg-surface-raised px-4 py-3 sm:px-5">Total{q ? " (filtered)" : ""}</td>
                {COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-3 py-3 text-right">
                    {col.render(totals)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}

function AdTableRow({ ad, q }: { ad: AdRow; q: string }) {
  return (
    <tr className="border-t border-white/5 text-ink-muted hover:bg-white/[0.025]">
      <td className="sticky left-0 z-10 max-w-[220px] sm:max-w-[360px] bg-surface py-2 pl-11 pr-4 sm:pl-12">
        <div className="truncate text-ink" title={ad.adName}>
          <Highlight text={ad.adName} q={q} />
        </div>
        <div className="text-[11px] text-ink-faint">ID {ad.adId}</div>
      </td>
      {COLUMNS.map((col) => (
        <td key={col.key} className="whitespace-nowrap px-3 py-2 text-right">
          {col.render(ad)}
        </td>
      ))}
    </tr>
  );
}

function Th({
  children,
  sortKey,
  sort,
  onSort,
  align = "right",
  sticky,
}: {
  children: React.ReactNode;
  sortKey: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
  sticky?: boolean;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
      className={`whitespace-nowrap px-3 py-2.5 font-medium ${align === "left" ? "text-left" : "text-right"} ${
        sticky ? "sticky left-0 z-10 bg-surface pl-4 sm:pl-5" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-ink ${active ? "text-ink" : ""} ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {children}
        <span className={`text-[9px] ${active ? "opacity-100" : "opacity-0"}`} aria-hidden>
          {sort.dir === 1 ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );
}

/** ROAS with a small status marker: below 1.0x loses money, 1.0–1.5x is thin, above is healthy. */
function RoasCell({ value }: { value: number | null }) {
  if (value == null) return <>{roas(value)}</>;
  const status = value < 1 ? { c: "bg-bad", t: "Unprofitable" } : value < 1.5 ? { c: "bg-[#d28e05]", t: "Thin margin" } : { c: "bg-good", t: "Profitable" };
  return (
    <span className="inline-flex items-center gap-1.5" title={status.t}>
      <span className={`h-1.5 w-1.5 rounded-full ${status.c}`} aria-label={status.t} />
      {roas(value)}
    </span>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-accent/30 text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
