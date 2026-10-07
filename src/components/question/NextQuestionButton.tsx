import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listQuestionFiles } from "../../lib/questions";
import { Button, type ButtonProps } from "../ui/Button";
import { PixelArrowIcon } from "../ui/PixelArrowIcon";

interface NextQuestionButtonProps extends Omit<
  ButtonProps,
  "children" | "onClick"
> {
  /** Task directory under public/questions/; also the route base path. */
  taskId: string;
  /** Runs before navigating, e.g. to stop audio. */
  onBeforeNavigate?: () => void;
}

/**
 * Moves to the next registered question number of the same task.
 * Renders nothing on the last question.
 */
export function NextQuestionButton({
  taskId,
  onBeforeNavigate,
  ...props
}: NextQuestionButtonProps) {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const current = Number.parseInt(questionNumber ?? "", 10);
  const [next, setNext] = useState<number | null>(null);

  useEffect(() => {
    if (!Number.isInteger(current)) return;
    let cancelled = false;
    listQuestionFiles(taskId)
      .then((files) => {
        const found = files.find((f) => f.number > current);
        if (!cancelled) setNext(found?.number ?? null);
      })
      .catch(() => {
        if (!cancelled) setNext(null);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, current]);

  if (next === null) return null;

  return (
    <Button
      {...props}
      onClick={() => {
        onBeforeNavigate?.();
        navigate(`/${taskId}/${next}`);
      }}
    >
      Next Question
      <PixelArrowIcon />
    </Button>
  );
}
