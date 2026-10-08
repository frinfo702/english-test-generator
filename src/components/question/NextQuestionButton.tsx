import { useContext, useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listQuestionFiles } from "../../lib/questions";
import {
  getNextMode,
  pickNext,
  setNextMode,
  subscribeNextMode,
  type NextMode,
} from "../../lib/nextMode";
import { useScoreHistory } from "../../hooks/useScoreHistory";
import { TrialItemContext } from "../../hooks/useTrialItem";
import { PixelArt } from "../pixel/PixelArt";
import { Button, type ButtonProps } from "../ui/Button";
import { PixelArrowIcon } from "../ui/PixelArrowIcon";
import styles from "./NextQuestionButton.module.css";

interface NextQuestionButtonProps extends Omit<
  ButtonProps,
  "children" | "onClick"
> {
  /** Task directory under public/questions/; also the route base path. */
  taskId: string;
  /** Runs before navigating, e.g. to stop audio. */
  onBeforeNavigate?: () => void;
  /** Hide the mode toggles where another instance on the page already shows them. */
  showModes?: boolean;
}

/**
 * Moves to another problem of the same task, chosen by the play mode:
 * shuffle or in order (exactly one is on) plus an independent "unsolved
 * only" filter. The mode toggles sit beside it and stay visible even when
 * there is no next problem, so they can be changed.
 */
export function NextQuestionButton(props: NextQuestionButtonProps) {
  return useContext(TrialItemContext) ? null : <NextQuestion {...props} />;
}

function NextQuestion({
  taskId,
  onBeforeNavigate,
  showModes = true,
  ...props
}: NextQuestionButtonProps) {
  const navigate = useNavigate();
  const { getAll } = useScoreHistory();
  const { questionId: current = "" } = useParams<{ questionId: string }>();
  const mode = useSyncExternalStore(subscribeNextMode, getNextMode);
  const [ids, setIds] = useState<string[]>([]);
  const [solved, setSolved] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    Promise.all([listQuestionFiles(taskId), getAll()])
      .then(([files, scores]) => {
        if (cancelled) return;
        setIds(files.map((f) => f.id));
        setSolved(
          new Set(
            scores
              .filter((s) => s.taskId === taskId && s.problemId)
              .map((s) => s.problemId!),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, getAll]);

  const updateMode = (patch: Partial<NextMode>) =>
    setNextMode({ ...mode, ...patch });

  const toggles = [
    {
      key: "shuffle",
      label: "Shuffle",
      on: mode.order === "shuffle",
      onClick: () => updateMode({ order: "shuffle" }),
    },
    {
      key: "order",
      label: "In order",
      on: mode.order === "order",
      onClick: () => updateMode({ order: "order" }),
    },
    {
      key: "unsolved",
      label: "Unsolved only",
      on: mode.unsolvedOnly,
      onClick: () => updateMode({ unsolvedOnly: !mode.unsolvedOnly }),
    },
  ] as const;

  // Shuffle is random per call, but whether a next problem exists is not.
  const hasNext =
    current !== "" && pickNext(mode, ids, current, solved) !== null;

  return (
    <>
      {showModes && (
        <span
          className={styles.modeGroup}
          role="group"
          aria-label="How the next question is chosen"
        >
          {toggles.map((t) => (
            <Button
              key={t.key}
              variant="ghost"
              size={props.size}
              className={[styles.modeToggle, t.on ? styles.modeOn : ""].join(
                " ",
              )}
              onClick={t.onClick}
              aria-pressed={t.on}
              aria-label={t.label}
              title={t.label}
            >
              <PixelArt
                layers={[MODE_ICONS[t.key]]}
                palette={{ x: "currentColor" }}
                width={12}
                height={12}
                className={styles.modeIcon}
              />
            </Button>
          ))}
        </span>
      )}
      {hasNext && (
        <Button
          {...props}
          onClick={() => {
            const next = pickNext(mode, ids, current, solved);
            if (next === null) return;
            onBeforeNavigate?.();
            navigate(`/${taskId}/${next}`);
          }}
        >
          Next Question
          <PixelArrowIcon />
        </Button>
      )}
    </>
  );
}

// 12×12 grids, drawn at 2px per cell.
// prettier-ignore
const MODE_ICONS: Record<"shuffle" | "order" | "unsolved", readonly string[]> = {
  // two crossing arrows
  shuffle: [
    ".........x",
    "..........x",
    "xx......xxxx",
    "..x....x..x",
    "...x..x..x",
    "....xx",
    "....xx",
    "...x..x..x",
    "..x....x..x",
    "xx......xxxx",
    "..........x",
    ".........x",
  ],
  // a repeat loop
  order: [
    "",
    "........x",
    ".........x",
    "..xxxxxxxxx",
    ".x.......x",
    ".x......x",
    "...x......x",
    "..x.......x",
    ".xxxxxxxxx",
    "..x",
    "...x",
  ],
  // an empty circle: not done yet
  unsolved: [
    "....xxxx",
    "..xx....xx",
    ".x........x",
    ".x........x",
    "x..........x",
    "x..........x",
    "x..........x",
    "x..........x",
    ".x........x",
    ".x........x",
    "..xx....xx",
    "....xxxx",
  ],
};
