import { useMemo } from "react";
import { CartesianGrid, Label, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ActivityPoint, ActivitySeries } from "@/lib/dashboard-activity";

const SERIES_COLORS = [
  "var(--info)",
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "oklch(0.68 0.11 220)",
  "var(--destructive)",
];

export function ActivitySnapshotChart({
  data,
  series,
  subtitle,
}: {
  data: ActivityPoint[];
  series: ActivitySeries[];
  subtitle: string;
}) {
  const isSingle = data.length === 1;
  const chartConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        series.map((item, index) => [
          item.key,
          { label: item.label, color: SERIES_COLORS[index % SERIES_COLORS.length] },
        ]),
      ),
    [series],
  );
  const yMax = Math.max(
    4,
    ...data.flatMap((point) => series.map((item) => Number(point[item.key] ?? 0))),
  );

  return (
    <section className="card-elevated overflow-hidden">
      <div className="px-4 pt-4 sm:px-5">
        <h2 className="font-display text-base font-semibold">Activity Snapshot</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="px-2 pb-4 pt-1 sm:px-4">
        {data.length === 0 || series.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No activity for this period.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full aspect-auto">
            <LineChart
              accessibilityLayer
              data={data}
              margin={{ top: 16, right: 16, left: 4, bottom: 4 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tick={{ fontSize: 11 }}
                interval={data.length <= 16 ? 0 : "preserveStartEnd"}
                minTickGap={data.length <= 16 ? 4 : 24}
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                domain={[0, yMax]}
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => {
                  if (value === 0) return "";
                  return value >= 1000 ? `${value / 1000}k` : String(value);
                }}
              >
                <Label
                  value="Count"
                  angle={-90}
                  position="insideLeft"
                  offset={8}
                  style={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
              </YAxis>
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <ChartLegend
                content={<ChartLegendContent />}
                className="flex-wrap gap-x-3 gap-y-1.5"
              />
              {series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={`var(--color-${item.key})`}
                  strokeWidth={2.5}
                  dot={{
                    r: isSingle ? 5 : 3,
                    fill: `var(--color-${item.key})`,
                    stroke: "var(--color-card)",
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-card)" }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </div>
    </section>
  );
}
