import { useState, useCallback } from "react";
import {
  fetchQuestionByFileWithMeta,
  fetchQuestionByNumberWithMeta,
  fetchRandomQuestionWithMeta,
} from "../lib/questions";

/**
 * Hook that loads a random pre-generated question file for a given task.
 * Call `load()` to fetch a new random question from public/questions/<taskPath>/.
 */
export function useQuestion<T>(taskPath: string) {
  const [data, setData] = useState<T | null>(null);
  const [file, setFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRandomQuestionWithMeta<T>(taskPath);
      setData(result.data);
      setFile(result.file);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [taskPath]);

  const loadByFile = useCallback(
    async (questionFile: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchQuestionByFileWithMeta<T>(
          taskPath,
          questionFile,
        );
        setData(result.data);
        setFile(result.file);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [taskPath],
  );

  const loadByQuestionNumber = useCallback(
    async (questionNumber: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchQuestionByNumberWithMeta<T>(
          taskPath,
          questionNumber,
        );
        setData(result.data);
        setFile(result.file);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [taskPath],
  );

  return { data, file, loading, error, load, loadByFile, loadByQuestionNumber };
}
