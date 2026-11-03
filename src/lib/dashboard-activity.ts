import type {
  ApiDashboardActivityPoint,
  DashboardPeriod,
} from "@/lib/api/services/dashboard";

export type ActivitySeries = { key: string; label: string };

export type ActivityPoint = { label: string } & Record<string, number | string>;

function parseDay(iso: string) {
  return new Date(`${iso.slice(0, 10)}T12:00:00`);
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-GB", { month: "short" });
}

/** Distinct metric series (key + label) found across all points, in first-seen order. */
export function collectActivitySeries(points: ApiDashboardActivityPoint[]): ActivitySeries[] {
  const seen = new Map<string, string>();
  for (const point of points) {
    for (const metric of point.metrics ?? []) {
      if (!seen.has(metric.key)) seen.set(metric.key, metric.label || metric.key);
    }
  }
  return [...seen.entries()].map(([key, label]) => ({ key, label }));
}

function toPoint(point: ApiDashboardActivityPoint, label: string): ActivityPoint {
  const out: ActivityPoint = { label };
  for (const metric of point.metrics ?? []) {
    out[metric.key] = Math.max(0, Number(metric.value) || 0);
  }
  return out;
}

function mapYearlyPoints(points: ApiDashboardActivityPoint[]): ActivityPoint[] {
  const buckets = new Map<string, ActivityPoint>();
  for (const point of points) {
    const key = point.date.slice(0, 7);
    const label = formatMonthLabel(parseDay(`${key}-01`));
    const bucket = buckets.get(key) ?? { label };
    for (const metric of point.metrics ?? []) {
      const prev = Number(bucket[metric.key] ?? 0);
      bucket[metric.key] = prev + Math.max(0, Number(metric.value) || 0);
    }
    buckets.set(key, bucket);
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

/** Maps API history points onto chart rows, with month buckets for Yearly. */
export function mapActivityPoints(
  points: ApiDashboardActivityPoint[],
  period?: DashboardPeriod,
): ActivityPoint[] {
  if (period === "Yearly") return mapYearlyPoints(points);
  return points.map((point) => toPoint(point, formatDayLabel(parseDay(point.date))));
}
