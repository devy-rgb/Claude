const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const DASH = "—";
export const money = (n: number | null) => (n == null ? DASH : usd0.format(n));
export const moneyCents = (n: number | null) => (n == null ? DASH : usd2.format(n));
export const number = (n: number | null) => (n == null ? DASH : int.format(n));
export const compactNumber = (n: number) => compact.format(n);
export const compactMoney = (n: number) => `${n < 0 ? "-" : ""}$${compact.format(Math.abs(n))}`;
export const roas = (n: number | null) => (n == null ? DASH : `${n.toFixed(2)}x`);
export const pct = (n: number | null, digits = 2) => (n == null ? DASH : `${(n * 100).toFixed(digits)}%`);
