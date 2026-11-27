"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, daysBetween, rangeLabel } from "@/lib/dates";
import type { DateRange } from "@/lib/types";

interface Props {
  value: DateRange;
  bounds: DateRange | null;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
}

type Preset = { label: string; range: (end: string) => DateRange };

const lastN = (n: number) => (end: string) => ({ from: addDays(end, -(n - 1)), to: end });

const PRESETS: Preset[] = [
  { label: "Yesterday", range: (end) => ({ from: end, to: end }) },
  { label: "Last 7 days", range: lastN(7) },
  { label: "Last 14 days", range: lastN(14) },
  { label: "Last 30 days", range: lastN(30) },
  { label: "Last 90 days", range: lastN(90) },
  { label: "Month to date", range: (end) => ({ from: `${end.slice(0, 8)}01`, to: end }) },
  {
    label: "Last month",
    range: (end) => {
      const lastOfPrev = addDays(`${end.slice(0, 8)}01`, -1);
      return { from: `${lastOfPrev.slice(0, 8)}01`, to: lastOfPrev };
    },
  },
];

export default function DateRangePicker({ value, bounds, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const root = useRef<HTMLDivElement>(null);
  // Presets are anchored to the most recent day of data, not "today", so they never show empty days.
  const anchor = bounds?.to ?? value.to;

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const apply = (r: DateRange) => {
    setOpen(false);
    if (r.from !== value.from || r.to !== value.to) onChange(r);
  };

  const draftValid = draft.from && draft.to && draft.from <= draft.to && daysBetween(draft.from, draft.to) <= 366;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait"
      >
        <CalendarIcon />
        <span className="tabular">{rangeLabel(value.from, value.to)}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="text-ink-muted">
          <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Select date range"
          className="absolute right-0 z-30 mt-2 w-[280px] overflow-hidden rounded-xl border border-line-strong bg-surface-raised shadow-2xl shadow-black/60"
        >
          <ul className="py-1.5">
            {PRESETS.map((p) => {
              const r = p.range(anchor);
              const selected = r.from === value.from && r.to === value.to;
              return (
                <li key={p.label}>
                  <button
                    type="button"
                    onClick={() => apply(r)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
                  >
                    <span className="w-4 text-accent" aria-hidden>
                      {selected && (
                        <svg width="16" height="16" viewBox="0 0 16 16">
                          <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className={selected ? "font-medium" : ""}>{p.label}</span>
                    <span className="ml-auto text-xs text-ink-faint tabular">{rangeLabel(r.from, r.to).replace(/, \d{4}/g, "")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <form
            className="border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (draftValid) apply(draft);
            }}
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">Custom range</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-ink-muted">
                From
                <input
                  type="date"
                  value={draft.from}
                  min={bounds?.from}
                  max={draft.to || bounds?.to}
                  onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-line-strong bg-page px-2 py-1.5 text-sm text-ink tabular focus:border-accent focus:outline-none"
                />
              </label>
              <label className="text-xs text-ink-muted">
                To
                <input
                  type="date"
                  value={draft.to}
                  min={draft.from || bounds?.from}
                  max={bounds?.to}
                  onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-line-strong bg-page px-2 py-1.5 text-sm text-ink tabular focus:border-accent focus:outline-none"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={!draftValid}
              className="mt-3 w-full rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-[#257de0] disabled:opacity-40"
            >
              Apply
            </button>
            {bounds && (
              <p className="mt-2 text-center text-[11px] text-ink-faint">
                Data available {rangeLabel(bounds.from, bounds.to)}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-ink-muted">
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
