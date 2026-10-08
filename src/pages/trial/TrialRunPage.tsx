import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import type { TaskId } from "../../hooks/useScoreHistory";
import {
  TrialItemContext,
  type TrialItemApi,
} from "../../hooks/useTrialItem";
import {
  getAllAttempts,
  getAttempt,
  putAttempts,
  type Attempt,
} from "../../lib/attempts";
import {
  formatMinutes,
  isTrial,
  planSection,
  routeFor,
  sectionsFor,
  type SectionKey,
  type TrialAttempt,
  type TrialSection,
} from "../../lib/trial";
import { formatSecondsAsMmSs } from "../../lib/time";
import { TASK_NAMES } from "./taskNames";
import styles from "./Trial.module.css";

/** How long a timed-out page may take to hand in what it has (speech scoring is slow). */
const SUBMIT_GRACE_MS = 20_000;

function deadline(trial: TrialAttempt, s: TrialSection): number | null {
  const started = trial.trial.sectionStarts[s.key];
  return started ? Date.parse(started) + s.minutes * 60_000 : null;
}

export function TrialRunPage({
  pages,
}: {
  pages: Partial<Record<TaskId, ReactElement>>;
}) {
  const { trialId = "" } = useParams<{ trialId: string }>();
  const navigate = useNavigate();
  const [trial, setTrial] = useState<TrialAttempt | null | undefined>();
  const [now, setNow] = useState(() => Date.now());
  // Section whose clock ran out while its current page is still handing in.
  const [holding, setHolding] = useState<SectionKey | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timedOutRef = useRef<SectionKey | null>(null);
  const submitRef = useRef<(() => void) | null>(null);
  const completedRef = useRef(-1);
  const routingRef = useRef<SectionKey | null>(null);
  const trialRef = useRef(trial);
  useEffect(() => {
    trialRef.current = trial;
  }, [trial]);

  useEffect(() => {
    getAttempt(trialId).then(
      (a) => setTrial(a && isTrial(a) ? a : null),
      () => setTrial(null),
    );
  }, [trialId]);

  const sections = trial ? sectionsFor(trial.trial.mode) : [];
  const isOver = (s: TrialSection) => {
    if (!trial) return false;
    const items = trial.trial.items.filter((i) => i.section === s.key);
    const routed = !s.adaptive || trial.trial.routes?.[s.key] !== undefined;
    if (routed && items.every((i) => i.done)) return true;
    const end = deadline(trial, s);
    return end !== null && end <= now && holding !== s.key;
  };
  const section = sections.find((s) => !isOver(s)) ?? null;
  const sectionEnd = trial && section ? deadline(trial, section) : null;
  const itemIndex =
    trial && section && sectionEnd !== null
      ? trial.trial.items.findIndex((i) => i.section === section.key && !i.done)
      : -1;
  const item = itemIndex >= 0 ? trial!.trial.items[itemIndex] : null;
  const needsModule2 =
    section?.adaptive === true &&
    sectionEnd !== null &&
    item === null &&
    trial?.trial.routes?.[section.key] === undefined;

  const save = async (next: TrialAttempt) => {
    setTrial(next);
    try {
      await putAttempts([next]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save the test.");
    }
  };

  // Every section is over: the test is done and scoring starts.
  useEffect(() => {
    if (!trial || section || trial.trial.finishedAt) return;
    const next = {
      ...trial,
      trial: { ...trial.trial, finishedAt: new Date().toISOString() },
    };
    void save(next);
  }, [trial, section]);

  // Module 1 is done: its score picks the easier or harder Module 2.
  useEffect(() => {
    if (!needsModule2 || !trial || !section) return;
    if (routingRef.current === section.key) return;
    routingRef.current = section.key;
    const module1 = trial.trial.items.filter((i) => i.section === section.key);
    void (async () => {
      const history = await getAllAttempts().catch((): Attempt[] => []);
      const byId = new Map(history.map((a) => [a.id, a]));
      const points = module1.reduce(
        (n, i) =>
          n + ((i.attemptId && byId.get(i.attemptId)?.score?.correct) || 0),
        0,
      );
      const max = module1.reduce((n, i) => n + i.maxPoints, 0);
      const route = routeFor(max > 0 ? points / max : 0);
      const module2 = await planSection(
        section,
        history,
        2,
        route,
        new Set(trial.trial.items.map((i) => `${i.taskId}/${i.problemId}`)),
      ).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        return [];
      });
      const current = trialRef.current!;
      void save({
        ...current,
        trial: {
          ...current.trial,
          items: [...current.trial.items, ...module2],
          routes: { ...current.trial.routes, [section.key]: route },
        },
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per section
  }, [needsModule2, section]);

  useEffect(() => {
    if (trial?.trial.finishedAt) navigate(`/trial/${trial.id}/report`);
  }, [trial, navigate]);

  useEffect(() => {
    if (sectionEnd === null || !section) return;
    let grace: ReturnType<typeof setTimeout> | undefined;
    const tick = setInterval(() => {
      const t = Date.now();
      if (t >= sectionEnd && timedOutRef.current !== section.key) {
        timedOutRef.current = section.key;
        // Same batch as setNow, so the page stays mounted long enough to submit.
        if (submitRef.current) {
          setHolding(section.key);
          submitRef.current();
          grace = setTimeout(() => setHolding(null), SUBMIT_GRACE_MS);
        }
      }
      setNow(t);
    }, 500);
    return () => {
      clearInterval(tick);
      clearTimeout(grace);
    };
  }, [sectionEnd, section]);

  const api = useMemo<TrialItemApi | null>(() => {
    if (!item || !trial) return null;
    return {
      problemId: item.problemId,
      onTimeout: (submit) => {
        submitRef.current = submit;
      },
      complete: (saved) => {
        // A timeout submit and the page's own finish can both land.
        if (completedRef.current === itemIndex) return;
        completedRef.current = itemIndex;
        setAdvancing(true);
        void Promise.resolve(saved)
          .catch((): Attempt | undefined => undefined)
          .then((attempt) => {
            const current = trialRef.current!;
            const items = current.trial.items.map((it, i) =>
              i === itemIndex
                ? { ...it, done: true, attemptId: attempt?.id }
                : it,
            );
            // One batch: releasing the hold before marking the item done
            // would mount the next page for a frame and start its audio.
            setAdvancing(false);
            setHolding(null);
            void save({ ...current, trial: { ...current.trial, items } });
          });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one API per item
  }, [trial?.id, itemIndex]);

  if (trial === undefined) return <LoadingSpinner message="Loading test..." />;
  if (trial === null) return <p>Practice test not found.</p>;

  if (!section) return <LoadingSpinner message="Finishing the test..." />;

  if (sectionEnd === null) {
    const position = sections.indexOf(section);
    const tasks = section.tasks.map((t) => ({
      name: TASK_NAMES[t.taskId] ?? t.taskId,
      count: trial.trial.items.filter((i) => i.taskId === t.taskId).length,
    }));
    return (
      <div className={styles.intro}>
        <p className="micro-label">
          Section {position + 1} of {sections.length}
        </p>
        <h1 className={styles.introTitle}>{section.label}</h1>
        <p className={styles.body}>
          You have <strong>{formatMinutes(section.minutes)}</strong> for this
          section. The clock keeps running if you leave or reload the page, and
          the section ends when time is up. You won't see whether your answers
          are correct until the end of the test.
        </p>
        {section.adaptive && (
          <p className={styles.body}>
            This section has <strong>two modules</strong>. How you do on
            Module 1 decides whether Module 2 is easier or harder, and only
            the harder Module 2 can lead to the top bands.
          </p>
        )}
        <ul className={styles.taskList}>
          {tasks
            .filter((t) => t.count > 0)
            .map((t) => (
              <li key={t.name}>
                <span>{t.name}</span>
                <span className="tnum">
                  {t.count} {t.count === 1 ? "set" : "sets"}
                  {section.adaptive && " per module"}
                </span>
              </li>
            ))}
        </ul>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.introActions}>
          <Button
            size="lg"
            onClick={() =>
              void save({
                ...trial,
                trial: {
                  ...trial.trial,
                  sectionStarts: {
                    ...trial.trial.sectionStarts,
                    [section.key]: new Date().toISOString(),
                  },
                },
              })
            }
          >
            Begin {section.label}
          </Button>
          <Link to="/trial" className={styles.quietLink}>
            Leave for now
          </Link>
        </div>
      </div>
    );
  }

  if (!item) {
    return <LoadingSpinner message="Preparing Module 2..." />;
  }

  const moduleItems = trial.trial.items.filter(
    (i) => i.section === section.key && i.module === item.module,
  );
  const position = moduleItems.indexOf(item) + 1;
  const remaining = Math.max(0, Math.ceil((sectionEnd - now) / 1000));

  return (
    <div>
      <div className={styles.runBar}>
        <span className={styles.runSection}>{section.label}</span>
        <span className={styles.runMeta}>
          {item.module && `Module ${item.module} · `}
          {TASK_NAMES[item.taskId]} · {position} of {moduleItems.length}
        </span>
        <span
          className={[
            styles.runClock,
            remaining <= 300 ? styles.runClockWarn : "",
          ].join(" ")}
          role="timer"
          aria-label="Time left in this section"
        >
          {formatSecondsAsMmSs(remaining)}
        </span>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {(advancing || holding) && (
        <LoadingSpinner
          message={holding ? "Time is up. Saving your answers..." : "Saving..."}
        />
      )}
      {api && (
        <TrialItemContext.Provider key={itemIndex} value={api}>
          <div hidden={advancing || holding !== null}>
            {pages[item.taskId]}
          </div>
        </TrialItemContext.Provider>
      )}
    </div>
  );
}
