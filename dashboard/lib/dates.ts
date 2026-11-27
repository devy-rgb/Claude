// All dates are plain YYYY-MM-DD strings handled in UTC to avoid timezone drift.
const DAY = 86_400_000;

export const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
export const toIso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => toIso(new Date(toDate(iso).getTime() + n * DAY));
export const daysBetween = (from: string, to: string) =>
  Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY);
export const isIsoDate = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toDate(s).getTime());

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** The equal-length window immediately before [from, to]. */
export function previousPeriod(from: string, to: string) {
  const len = daysBetween(from, to) + 1;
  return { from: addDays(from, -len), to: addDays(from, -1) };
}

const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fmtYear = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
export const shortDate = (iso: string) => fmt.format(toDate(iso));
export const longDate = (iso: string) => fmtYear.format(toDate(iso));
export function rangeLabel(from: string, to: string) {
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${sameYear ? shortDate(from) : longDate(from)} – ${longDate(to)}`;
}
