import { Fragment, type ReactNode } from "react";
import { parseBlocks } from "../../lib/prose";

/**
 * The little Markdown an AI reply uses — headings, **bold**, *italic*,
 * `code`, bulleted and numbered lists — as plain elements, so the reader
 * never sees the asterisks. Anything else stays text.
 * ponytail: no nested lists, links or tables; add a Markdown library if
 * replies start leaning on them.
 */
export function Prose({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <div className={className}>{blocks(text)}</div>;
}

function blocks(text: string): ReactNode {
  return parseBlocks(text).map((b, i) =>
    b.kind === "heading" ? (
      <p key={i} className="micro-label">
        {inline(b.text)}
      </p>
    ) : b.kind === "p" ? (
      <p key={i}>{inline(b.text)}</p>
    ) : (
      <Fragment key={i}>
        {b.kind === "ul" ? (
          <ul>
            {b.items.map((t, j) => (
              <li key={j}>{inline(t)}</li>
            ))}
          </ul>
        ) : (
          <ol>
            {b.items.map((t, j) => (
              <li key={j}>{inline(t)}</li>
            ))}
          </ol>
        )}
      </Fragment>
    ),
  );
}

function inline(text: string): ReactNode {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
        <code key={i}>{part.slice(1, -1)}</code>
      ) : /^[*_].+[*_]$/.test(part) && part.length > 2 ? (
        <em key={i}>{part.slice(1, -1)}</em>
      ) : (
        part
      ),
    );
}
