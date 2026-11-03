import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: pageTitle("Dashboard") }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" subtitle="Overview" />
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Coming Soon</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Dashboard features are under development.
        </p>
      </div>
    </div>
  );
}
