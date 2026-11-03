import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { ActivitySnapshotChart } from "@/components/dashboard/ActivitySnapshotChart";
import { DashboardPeriodFilter } from "@/components/dashboard/DashboardPeriodFilter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  dashboardService,
  type ApiDashboard,
  type DashboardPeriod,
  type DashboardQueryParams,
} from "@/lib/api/services/dashboard";
import { collectActivitySeries, mapActivityPoints } from "@/lib/dashboard-activity";
import type { ApiError } from "@/lib/api/axios";
import { usePermissions } from "@/contexts/PermissionContext";
import { canAccessPath, toAppPath } from "@/lib/authorization";
import { formatDateTime } from "@/lib/module-ui";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: pageTitle("Dashboard") }] }),
  component: Dashboard,
});

export const dashboardQueryKey = ["dashboard"] as const;
export const dashboardActivityQueryKey = ["dashboard", "activity"] as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function Dashboard() {
  const { menus, isLoading: permissionsLoading } = usePermissions();
  const canReadDashboard = !permissionsLoading && menus.length > 0 && canAccessPath(menus, "/");
  const [period, setPeriod] = useState<DashboardPeriod>("Daily");
  const [customFrom, setCustomFrom] = useState(monthStartIso);
  const [customTo, setCustomTo] = useState(todayIso);

  const queryParams = useMemo<DashboardQueryParams>(
    () => ({
      period,
      ...(period === "Custom" ? { fromDate: customFrom, toDate: customTo } : {}),
    }),
    [period, customFrom, customTo],
  );

  const query = useQuery({
    queryKey: [...dashboardQueryKey, queryParams],
    queryFn: async () => (await dashboardService.get(queryParams)).data,
    placeholderData: keepPreviousData,
    enabled: canReadDashboard,
  });

  const activityQuery = useQuery({
    queryKey: [...dashboardActivityQueryKey, queryParams],
    queryFn: async () => (await dashboardService.getActivity(queryParams)).data,
    placeholderData: keepPreviousData,
    enabled: canReadDashboard,
  });

  const data = query.data;
  const metrics = data?.metrics ?? [];
  const recentItems = data?.recentItems ?? [];

  const activityPoints = activityQuery.data?.points ?? [];
  const activitySeries = useMemo(() => collectActivitySeries(activityPoints), [activityPoints]);
  const activityRows = useMemo(
    () => mapActivityPoints(activityPoints, period),
    [activityPoints, period],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle={formatPeriodLabel(period, data)}
        actions={
          <DashboardPeriodFilter
            period={period}
            onPeriodChange={setPeriod}
            customFrom={customFrom}
            customTo={customTo}
            onCustomChange={(from, to) => {
              setCustomFrom(from);
              setCustomTo(to);
            }}
            fetching={query.isFetching || activityQuery.isFetching}
          />
        }
      />

      {query.isLoading && !query.isPlaceholderData ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading dashboard…
        </div>
      ) : query.isError && !data ? (
        <div className="card-elevated p-8 text-center">
          <p className="font-medium">Unable to load dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {(query.error as unknown as ApiError)?.message || "Please try again."}
          </p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {metrics.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.key} className="card-elevated flex flex-col gap-1 p-4">
                  <div className="text-xs text-muted-foreground">{metric.label}</div>
                  <div className="font-display text-2xl font-semibold tabular-nums">
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <section className="card-elevated overflow-hidden">
            <div className="border-b px-4 py-3 sm:px-5">
              <h2 className="font-display font-semibold">Recent activity</h2>
              <p className="text-xs text-muted-foreground">Latest items from the system</p>
            </div>
            {recentItems.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground sm:px-5">
                Nothing to show yet.
              </div>
            ) : (
              <ul className="divide-y">
                {recentItems.map((item, index) => {
                  const path = item.linkPath ? toAppPath(item.linkPath) : null;
                  const content = (
                    <>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.title}</div>
                        {item.subtitle ? (
                          <div className="truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </div>
                        ) : null}
                      </div>
                      {item.occurredAt ? (
                        <div className="shrink-0 text-xs text-muted-foreground">
                          {formatDateTime(item.occurredAt)}
                        </div>
                      ) : null}
                    </>
                  );
                  return (
                    <li key={`${item.title}-${index}`}>
                      {path && canAccessPath(menus, path) ? (
                        <Link
                          to={path}
                          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 sm:px-5"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {activityQuery.isLoading && !activityQuery.isPlaceholderData ? (
            <section className="card-elevated flex h-[300px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading activity history…
            </section>
          ) : activityQuery.isError && !activityQuery.data ? (
            <section className="card-elevated p-8 text-center">
              <p className="font-medium">Unable to load activity history</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(activityQuery.error as unknown as ApiError)?.message || "Please try again."}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                size="sm"
                onClick={() => void activityQuery.refetch()}
              >
                Retry
              </Button>
            </section>
          ) : (
            <ActivitySnapshotChart
              data={activityRows}
              series={activitySeries}
              subtitle={
                period === "Yearly"
                  ? "Monthly history for the selected year"
                  : "Daily history for the selected period"
              }
            />
          )}
        </>
      )}
    </div>
  );
}

function formatPeriodLabel(period: DashboardPeriod, data?: ApiDashboard) {
  const range =
    data?.fromDate && data.period === period
      ? { from: data.fromDate, to: data.toDate }
      : undefined;

  if (!range) {
    return period === "Daily"
      ? "Today's snapshot"
      : period === "Weekly"
        ? "This week"
        : period === "Monthly"
          ? "This month"
          : period === "Yearly"
            ? "This year"
            : "Custom range";
  }

  const from = formatShortDate(range.from);
  const to = formatShortDate(range.to);
  if (period === "Daily") return `Stats for ${from}`;
  return `Stats for ${from} – ${to}`;
}

function formatShortDate(iso: string) {
  const day = iso.slice(0, 10);
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
