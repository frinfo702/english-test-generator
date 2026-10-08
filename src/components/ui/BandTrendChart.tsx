import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./ScoreTrendChart.module.css";

export interface BandPoint {
  id: string;
  label: string;
  band: number;
}

/**
 * One band series on the fixed 1–6 scale. Sections are separate small
 * multiples rather than lines on one plot: the muted section hues are too
 * close to tell apart as a categorical set.
 */
export function BandTrendChart({
  title,
  points,
  colorVar,
}: {
  title: string;
  points: BandPoint[];
  colorVar: string;
}) {
  const color = `var(${colorVar})`;
  return (
    <figure className={styles.wrap} aria-label={`${title} band trend`}>
      <figcaption className={styles.tooltipDate}>{title}</figcaption>
      {points.length === 0 ? (
        <p className={styles.empty}>No scored tests yet.</p>
      ) : (
        <div className={styles.plot} aria-hidden="true">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart
              data={points}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
              <XAxis
                dataKey="id"
                tickFormatter={(id: string) =>
                  points.find((p) => p.id === id)?.label ?? ""
                }
                tickLine={false}
                axisLine={{ stroke: "var(--color-chart-grid)" }}
                tick={{ fill: "var(--color-chart-label)", fontSize: 11 }}
                minTickGap={24}
                padding={{ left: 8, right: 8 }}
              />
              <YAxis
                domain={[1, 6]}
                ticks={[1, 2, 3, 4, 5, 6]}
                tickLine={false}
                axisLine={false}
                width={24}
                tick={{ fill: "var(--color-chart-label)", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as BandPoint;
                  return (
                    <div className={styles.tooltip}>
                      <p className={styles.tooltipDate}>{p.label}</p>
                      <p className={styles.tooltipRow}>
                        <span>Band</span>
                        <span className={styles.tooltipValue}>{p.band}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="linear"
                dataKey="band"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--color-surface)", stroke: color, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "var(--color-surface)", stroke: color, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <ul className={styles.srList}>
        {points.map((p) => (
          <li key={p.id}>
            {p.label}: band {p.band}
          </li>
        ))}
      </ul>
    </figure>
  );
}
