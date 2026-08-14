export const TOOL_LABELS: Record<string, string> = {
  fetch_docs: "Fetching docs",
  fetch_schema: "Fetching schema",
  validate_rui: "Validating RUI",
  save_rui: "Saving spec",
};

export function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName;
}
