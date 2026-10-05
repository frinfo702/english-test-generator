import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { buildActivity, type ActivityDay } from "../../lib/activity";
import styles from "./StreakCalendar.module.css";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface StreakCalendarProps {
  /** ISO timestamps, one per completed session. */
  dates: string[];
}

interface Hover {
  day: ActivityDay;
  x: number;
  y: number;
}

function describe(day: ActivityDay): string {
  const when = day.date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (day.count === 0) return `No sessions on ${when}`;
  return `${day.count} session${day.count === 1 ? "" : "s"} on ${when}`;
}

export function StreakCalendar({ dates }: StreakCalendarProps) {
  const summary = useMemo(() => buildActivity(dates), [dates]);
  const cardRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  // On narrow screens start at the most recent weeks, like GitHub.
  // Layout may settle after mount, so re-pin whenever the box resizes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pin = () => {
      el.scrollLeft = el.scrollWidth;
    };
    pin();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(pin);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const monthLabels = summary.weeks.map((week, i) => {
    const month = week[0].date.getMonth();
    const prev = i > 0 ? summary.weeks[i - 1][0].date.getMonth() : -1;
    // Skip a label squeezed into the very first column.
    if (month === prev || (i === 0 && week[0].date.getDate() > 7)) return "";
    return MONTHS[month];
  });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-key]");
    if (!target || !cardRef.current) {
      setHover(null);
      return;
    }
    const [w, d] = [Number(target.dataset.w), Number(target.dataset.d)];
    const rect = target.getBoundingClientRect();
    const wrap = cardRef.current.getBoundingClientRect();
    setHover({
      day: summary.weeks[w][d],
      x: rect.left - wrap.left + rect.width / 2,
      y: rect.top - wrap.top,
    });
  };

  return (
    <section
      ref={cardRef}
      className={styles.card}
      aria-labelledby="streak-heading"
    >
      <div className={styles.head}>
        <h2 id="streak-heading" className={styles.title}>
          {summary.totalSessions} session
          {summary.totalSessions === 1 ? "" : "s"} in the last year
        </h2>
        <dl className={styles.streaks}>
          <div className={styles.streak}>
            <dt>Current streak</dt>
            <dd>
              {summary.currentStreak}
              <span>d</span>
            </dd>
          </div>
          <div className={styles.streak}>
            <dt>Longest</dt>
            <dd>
              {summary.longestStreak}
              <span>d</span>
            </dd>
          </div>
          <div className={styles.streak}>
            <dt>Active days</dt>
            <dd>{summary.activeDays}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.scroll} ref={scrollRef}>
        <div
          className={styles.calendar}
          style={{ ["--weeks" as string]: summary.weeks.length }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <div className={styles.months} aria-hidden="true">
            {monthLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
          <div className={styles.days} aria-hidden="true">
            {DAY_LABELS.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
          <div
            className={styles.grid}
            role="img"
            aria-label={`Practice activity: ${summary.activeDays} active days, current streak ${summary.currentStreak} days`}
          >
            {summary.weeks.map((week, w) =>
              week.map((day, d) => (
                <span
                  key={day.key}
                  data-key={day.future ? undefined : day.key}
                  data-w={w}
                  data-d={d}
                  data-level={day.level}
                  className={day.future ? styles.future : styles.cell}
                  style={{ gridColumn: w + 1, gridRow: d + 1 }}
                />
              )),
            )}
          </div>
        </div>
      </div>

      {hover && (
        <div
          className={styles.tooltip}
          style={{ left: hover.x, top: hover.y }}
          role="presentation"
        >
          {describe(hover.day)}
        </div>
      )}

      <div className={styles.legend} aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={styles.cell} data-level={l} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}
