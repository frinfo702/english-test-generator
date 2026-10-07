import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listQuestionFiles } from "../../lib/questions";
import {
  NEXT_MODES,
  NEXT_MODE_LABELS,
  loadNextMode,
  pickNext,
  saveNextMode,
  type NextMode,
} from "../../lib/nextMode";
import { useScoreHistory } from "../../hooks/useScoreHistory";
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
}

const fileNumber = (file: string) => Number.parseInt(file, 10);

/**
 * Moves to another problem of the same task, chosen by the play mode
 * (shuffle / in order / unsolved only). The mode toggle sits beside it and
 * stays visible even when there is no next problem, so it can be changed.
 */
export function NextQuestionButton({
  taskId,
  onBeforeNavigate,
  ...props
}: NextQuestionButtonProps) {
  const navigate = useNavigate();
  const { getAll } = useScoreHistory();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const current = Number.parseInt(questionNumber ?? "", 10);
  const [mode, setMode] = useState<NextMode>(loadNextMode);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [solved, setSolved] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    Promise.all([listQuestionFiles(taskId), getAll()])
      .then(([files, scores]) => {
        if (cancelled) return;
        setNumbers(files.map((f) => f.number));
        setSolved(
          new Set(
            scores
              .filter((s) => s.taskId === taskId && s.questionFile)
              .map((s) => fileNumber(s.questionFile!)),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setNumbers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, getAll]);

  const cycleMode = () => {
    const nextMode = NEXT_MODES[(NEXT_MODES.indexOf(mode) + 1) % NEXT_MODES.length];
    setMode(nextMode);
    saveNextMode(nextMode);
  };

  // Shuffle is random per call, but whether a next problem exists is not.
  const hasNext =
    Number.isInteger(current) &&
    pickNext(mode, numbers, current, solved) !== null;

  return (
    <>
      <Button
        variant="ghost"
        size={props.size}
        onClick={cycleMode}
        title="Change how the next question is chosen"
        aria-label={`Next question order: ${NEXT_MODE_LABELS[mode]}. Click to change.`}
      >
        <PixelArt
          layers={[MODE_ICONS[mode]]}
          palette={{ x: "currentColor" }}
          width={8}
          height={8}
          className={styles.modeIcon}
        />
        {NEXT_MODE_LABELS[mode]}
      </Button>
      {hasNext && (
        <Button
          {...props}
          onClick={() => {
            const next = pickNext(mode, numbers, current, solved);
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

// prettier-ignore
const MODE_ICONS: Record<NextMode, readonly string[]> = {
  // a die
  shuffle: [
    ".xxxxxx.",
    "xxxxxxxx",
    "xx.xx.xx",
    "xxxxxxxx",
    "xxxxxxxx",
    "xx.xx.xx",
    "xxxxxxxx",
    ".xxxxxx.",
  ],
  // a numbered list
  order: [
    "",
    "xx.xxxxx",
    "",
    "xx.xxxxx",
    "",
    "xx.xxxxx",
  ],
  // an empty circle: not done yet
  unsolved: [
    "..xxxx..",
    ".x....x.",
    "x......x",
    "x......x",
    "x......x",
    "x......x",
    ".x....x.",
    "..xxxx..",
  ],
};
