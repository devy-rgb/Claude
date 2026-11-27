import Dashboard from "@/components/Dashboard";
import { getDashboardData } from "@/lib/data-source";
import { isIsoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { from, to } = await searchParams;
  try {
    const data = await getDashboardData(isIsoDate(from) ? from : undefined, isIsoDate(to) ? to : undefined);
    return <Dashboard initial={data} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);
    return (
      <main className="mx-auto max-w-xl px-4 py-24">
        <h1 className="text-lg font-semibold">Couldn’t load metrics</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The dashboard couldn’t query <code className="text-ink">daily_ad_metrics</code> in Supabase. Check that the
          migration has been run and that <code className="text-ink">SUPABASE_URL</code> /{" "}
          <code className="text-ink">SUPABASE_SERVICE_ROLE_KEY</code> are set.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-surface p-3 text-xs text-bad">{message}</pre>
      </main>
    );
  }
}
