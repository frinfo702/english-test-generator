/** The block structure of the little Markdown an AI reply uses (see Prose). */
type Block =
  | { kind: "heading"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "p"; text: string };

export function parseBlocks(text: string): Block[] {
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ kind: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const item = bullet ?? numbered;
    if (!line) flush();
    else if (heading) {
      flush();
      out.push({ kind: "heading", text: heading[1] });
    } else if (item) {
      flush();
      const kind = bullet ? "ul" : "ol";
      const last = out.at(-1);
      if (last && last.kind === kind) last.items.push(item[1]);
      else out.push({ kind, items: [item[1]] });
    } else para.push(line);
  }
  flush();
  return out;
}
