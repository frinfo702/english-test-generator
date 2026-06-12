import { useEffect, useState } from "react";
import { fetchTaskQuestionCount } from "../lib/questions";
import type { TaskId } from "./useScoreHistory";

export function useTaskQuestionCounts(taskIds: TaskId[]) {
  const [counts, setCounts] = useState<Partial<Record<TaskId, number | null>>>(
    {},
  );

  useEffect(() => {
    let active = true;

    Promise.all(
      taskIds.map(async (taskId) => {
        try {
          const count = await fetchTaskQuestionCount(taskId);
          return { taskId, count } as const;
        } catch {
          return { taskId, count: null } as const;
        }
      }),
    ).then((results) => {
      if (!active) return;
      const next: Partial<Record<TaskId, number | null>> = {};
      for (const { taskId, count } of results) {
        next[taskId] = count;
      }
      setCounts(next);
    });

    return () => {
      active = false;
    };
  }, [taskIds]);

  return counts;
}
