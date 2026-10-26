/** H2 headings of a Markdown body, with the same ids the page gives them (table of contents). */
export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function h2s(markdown: string): { id: string; text: string }[] {
  return [...markdown.matchAll(/^##\s+(.+?)\s*#*\s*$/gm)].map((m) => ({ id: headingId(m[1]!), text: m[1]! }));
}
