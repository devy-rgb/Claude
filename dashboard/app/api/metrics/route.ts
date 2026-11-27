import { NextResponse, type NextRequest } from "next/server";
import { getDashboardData } from "@/lib/data-source";
import { daysBetween, isIsoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") ?? undefined;
  const to = req.nextUrl.searchParams.get("to") ?? undefined;
  if ((from && !isIsoDate(from)) || (to && !isIsoDate(to))) {
    return NextResponse.json({ error: "from/to must be YYYY-MM-DD" }, { status: 400 });
  }
  if (from && to && Math.abs(daysBetween(from, to)) > 366) {
    return NextResponse.json({ error: "Range is limited to one year" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getDashboardData(from, to));
  } catch (err) {
    console.error("[api/metrics]", err);
    const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
    return NextResponse.json({ error: message ?? "Failed to load metrics" }, { status: 500 });
  }
}
