import { useState, useCallback } from "react";
import { generateProblem } from "../lib/claude";
import { loadPromptConfig, buildPrompt } from "../lib/prompts";

interface UseGenerateProblemOptions {
  promptPath: string;
  variables?: Record<string, string>;
}

export function useGenerateProblem<T>({ promptPath, variables = {} }: UseGenerateProblemOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (overrideVariables?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const config = await loadPromptConfig(promptPath);
      const vars = { ...variables, ...overrideVariables };
      const userPrompt = buildPrompt(config.userPromptTemplate, vars);
      const result = await generateProblem<T>(config.systemPrompt, userPrompt);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [promptPath, variables]);

  return { data, loading, error, generate };
}
