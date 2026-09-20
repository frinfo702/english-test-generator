import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScoreEntry } from "../../hooks/useScoreHistory";
import { buildScoreTrend, type TrendPoint } from "../../lib/scoreTrend";
import styles from "./ScoreTrendChart.module.css";

interface ScoreTrendChartProps {
  entries: ScoreEntry[];
  /** CSS custom property that carries the series colour, e.g. `--color-reading`. */
  colorVar: string;
  ariaLabel?: string;
}

/**
 * Accuracy over sessions. Recharts supplies the axes, the hover tooltip and
 * responsive measurement; colours come from the app's tokens so the chart
 * reads as part of the document rather than a widget.
 *
 * The plot is decoration for assistive tech: the same numbers are rendered as
 * a visually hidden list, so nothing here depends on hovering.
 */
export function ScoreTrendChart({
  entries,
  colorVar,
  ariaLabel = "Accuracy trend",
}: ScoreTrendChartProps) {
  const gradientId = useId();
  const { data, tickLabel } = buildScoreTrend(entries);

  if (data.length === 0) {
    return <p className={styles.empty}>No records yet.</p>;
  }

  const color = `var(${colorVar})`;

  return (
    <figure className={styles.wrap} aria-label={ariaLabel}>
      <div className={styles.plot} aria-hidden="true">
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 6, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--color-chart-grid)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="id"
              tickFormatter={(id: string) => tickLabel.get(id) ?? ""}
              tickLine={false}
              axisLine={{ stroke: "var(--color-chart-grid)" }}
              tick={{ fill: "var(--color-chart-label)", fontSize: 11 }}
              minTickGap={24}
              interval="preserveStartEnd"
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickLine={false}
              axisLine={false}
              width={40}
              tick={{ fill: "var(--color-chart-label)", fontSize: 11 }}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as TrendPoint;
                return (
                  <div className={styles.tooltip}>
                    <p className={styles.tooltipDate}>
                      {point.date}
                      {point.session ? ` · ${point.session}` : ""}
                    </p>
                    <p className={styles.tooltipRow}>
                      <span>Accuracy</span>
                      <span className={styles.tooltipValue}>{point.pct}%</span>
                    </p>
                    {point.time && (
                      <p className={styles.tooltipRow}>
                        <span>Time</span>
                        <span className={styles.tooltipValue}>{point.time}</span>
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="pct"
              name="Accuracy"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{
                r: 2.5,
                fill: "var(--color-surface)",
                stroke: color,
                strokeWidth: 2,
              }}
              activeDot={{
                r: 4,
                fill: "var(--color-surface)",
                stroke: color,
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ul className={styles.srList}>
        {data.map((point) => (
          <li key={point.id}>
            {point.date}
            {point.session ? ` (${point.session})` : ""}: {point.pct}% accuracy
            {point.time ? `, ${point.time}` : ""}
          </li>
        ))}
      </ul>
    </figure>
  );
}
