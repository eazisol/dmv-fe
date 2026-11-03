import { http } from "@/lib/api/axios";
import type { ApiEnvelope } from "./auth";

export type DashboardPeriod = "Daily" | "Weekly" | "Monthly" | "Yearly" | "Custom";

export interface ApiDashboardMetric {
  key: string;
  label: string;
  value: number;
}

export interface ApiDashboardFeedItem {
  title: string;
  subtitle?: string | null;
  occurredAt?: string | null;
  linkPath?: string | null;
}

/** Core `DashboardSummaryDto` — generic metrics + recent items supplied by the host. */
export interface ApiDashboard {
  period: string;
  fromDate: string;
  toDate: string;
  metrics: ApiDashboardMetric[];
  recentItems: ApiDashboardFeedItem[];
}

export interface ApiDashboardActivityPoint {
  date: string;
  metrics: ApiDashboardMetric[];
}

export interface ApiDashboardActivity {
  period: string;
  fromDate: string;
  toDate: string;
  points: ApiDashboardActivityPoint[];
}

export type DashboardQueryParams = {
  period: DashboardPeriod;
  date?: string;
  fromDate?: string;
  toDate?: string;
};

function toParams({ period, date, fromDate, toDate }: DashboardQueryParams) {
  return {
    Period: period,
    ...(date ? { Date: date } : {}),
    ...(fromDate ? { FromDate: fromDate } : {}),
    ...(toDate ? { ToDate: toDate } : {}),
  };
}

export const dashboardService = {
  get: (query: DashboardQueryParams) =>
    http.get<ApiEnvelope<ApiDashboard>>("Dashboard", { params: toParams(query) }),
  getActivity: (query: DashboardQueryParams) =>
    http.get<ApiEnvelope<ApiDashboardActivity>>("Dashboard/activity", { params: toParams(query) }),
};
