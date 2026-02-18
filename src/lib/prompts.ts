export interface PromptConfig {
  taskId: string;
  taskName: string;
  section: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

export function buildPrompt(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

export async function loadPromptConfig(path: string): Promise<PromptConfig> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load prompt config: ${path}`);
  return res.json();
}
