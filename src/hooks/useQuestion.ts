import { useState, useCallback } from "react";
import { fetchRandomQuestion } from "../lib/questions";

/**
 * Hook that loads a random pre-generated question file for a given task.
 * Call `load()` to fetch a new random question from public/questions/<taskPath>/.
 */
export function useQuestion<T>(taskPath: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRandomQuestion<T>(taskPath);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [taskPath]);

  return { data, loading, error, load };
}
