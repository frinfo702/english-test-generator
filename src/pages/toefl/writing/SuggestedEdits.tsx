import { useState } from "react";
import {
  EDIT_THEMES,
  WRITING_TEMPLATES,
  parseSuggestedEdits,
  parseTemplateUse,
  splitByEdits,
  type EditTheme,
  type WritingTaskId,
} from "../../../lib/writingFeedback";
import styles from "./SuggestedEdits.module.css";

const THEMES = Object.keys(EDIT_THEMES) as EditTheme[];

/**
 * The AI's edits laid over the response, numbered, with the reason for each
 * below; themes filter both. Edits the model didn't copy exactly are left out.
 */
function EditedResponse({ text, reply }: { text: string; reply: string }) {
  const [shown, setShown] = useState<Set<EditTheme>>(() => new Set(THEMES));
  const segments = splitByEdits(text, parseSuggestedEdits(reply));
  const edits = segments.flatMap((s) => (s.kind === "edit" ? [s] : []));
  if (edits.length === 0) return null;

  const toggle = (theme: EditTheme) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(theme)) next.delete(theme);
      else next.add(theme);
      return next;
    });

  return (
    <section className={styles.block} aria-label="Suggested edits">
      <div className={styles.head}>
        <p className="micro-label">Suggested edits</p>
        <div className={styles.filters} role="group" aria-label="Show themes">
          {THEMES.map((theme) => {
            const count = edits.filter((e) => e.edit.theme === theme).length;
            if (count === 0) return null;
            return (
              <button
                key={theme}
                type="button"
                className={styles.filter}
                aria-pressed={shown.has(theme)}
                onClick={() => toggle(theme)}
              >
                {EDIT_THEMES[theme]} <span>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className={styles.response}>
        {segments.map((s, i) =>
          s.kind === "text" || !shown.has(s.edit.theme) ? (
            s.kind === "text" ? (
              s.text
            ) : (
              s.edit.from
            )
          ) : (
            <span key={i} className={styles.edit}>
              <del>
                <span className="sr-only">removed: </span>
                {s.edit.from}
              </del>
              {s.edit.to && (
                <ins>
                  <span className="sr-only">added: </span>
                  {s.edit.to}
                </ins>
              )}
              <sup className={styles.n}>{s.n}</sup>
            </span>
          ),
        )}
      </p>

      <ol className={styles.reasons}>
        {edits
          .filter((e) => shown.has(e.edit.theme))
          .map((e) => (
            <li key={e.n} className={styles.reason}>
              <span className={styles.n}>{e.n}</span>
              <span>
                <span className={styles.theme}>
                  {EDIT_THEMES[e.edit.theme]}
                </span>
                {e.edit.why}
              </span>
            </li>
          ))}
      </ol>
    </section>
  );
}

/** Which parts of the response template this answer used. */
function TemplateUse({
  taskId,
  reply,
}: {
  taskId: WritingTaskId;
  reply: string;
}) {
  const parts = WRITING_TEMPLATES[taskId];
  const used = parseTemplateUse(reply, parts.length);
  if (!used) return null;
  const count = used.filter(Boolean).length;

  return (
    <section className={styles.block} aria-label="Template">
      <div className={styles.head}>
        <p className="micro-label">Template</p>
        <p className={styles.tally}>
          {count === parts.length
            ? "You used the whole template"
            : `You used ${count} of ${parts.length} parts`}
        </p>
      </div>
      <ul className={styles.parts}>
        {parts.map((part, i) => (
          <li key={part.name} className={styles.part} data-used={used[i]}>
            <span className={styles.mark} aria-hidden="true" />
            <span>
              <span className={styles.partName}>
                {part.name}
                <span className="sr-only">
                  {used[i] ? " (used)" : " (missing)"}
                </span>
              </span>
              {!used[i] && (
                <span className={styles.partHint}>
                  {/* A missing part shows how to start it next time. */}
                  It {part.does}. Try: {part.phrases.join(" / ")}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.source}>
        Structure after{" "}
        <a
          href="https://magoosh.com/toefl/toefl-writing-templates/"
          target="_blank"
          rel="noreferrer"
        >
          Magoosh's TOEFL writing templates
        </a>
        .
      </p>
    </section>
  );
}

export function WritingFeedback({
  taskId,
  text,
  reply,
}: {
  taskId: WritingTaskId;
  text: string;
  reply: string;
}) {
  return (
    <>
      <EditedResponse text={text} reply={reply} />
      <TemplateUse taskId={taskId} reply={reply} />
    </>
  );
}
