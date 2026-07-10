/** Read a CSS custom property from the document root. */
export function readCssVar(name: string, fallback = ""): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}
