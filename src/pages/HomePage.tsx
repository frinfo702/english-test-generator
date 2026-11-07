import { useId, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AsciiPond } from "../components/home/AsciiPond";
import { TASK_NAMES } from "./trial/taskNames";
import styles from "./HomePage.module.css";

interface Destination {
  label: string;
  hint: string;
  path: string;
  keys?: string;
}

const HUBS: Destination[] = [
  { label: "TOEFL iBT 2026", hint: "All four sections", path: "/toefl", keys: "reading writing listening speaking" },
  { label: "TOEIC L&R", hint: "Parts 2–7", path: "/toeic" },
  { label: "Practice Test", hint: "Timed TOEFL, scored 1–6", path: "/trial", keys: "mock exam trial full" },
  { label: "Speaking Loop", hint: "Talk, see natural English, redo", path: "/speak", keys: "speaking fluency" },
  { label: "Conversation", hint: "An AI partner that asks back", path: "/speak/talk", keys: "speaking talk chat ai" },
  { label: "Chunk Cards", hint: "Spaced recall, out loud", path: "/speak/cards", keys: "speaking vocabulary phrases" },
  { label: "Review", hint: "Redo what you got wrong", path: "/review", keys: "mistakes wrong" },
  { label: "Dashboard", hint: "Scores and history", path: "/dashboard", keys: "progress" },
];

const TASKS: Destination[] = Object.entries(TASK_NAMES).map(([id, label]) => {
  const [test, section] = id.split("/");
  const hint =
    test === "toefl" ? `TOEFL · ${section[0].toUpperCase()}${section.slice(1)}`
    : test === "toeic" ? `TOEIC · ${Number(id.slice(-1)) <= 4 ? "Listening" : "Reading"}`
    : "Daily drill";
  return { label: label!, hint, path: `/${id}` };
});

const ALL = [...HUBS, ...TASKS];
const STARTERS = ["/toefl", "/toeic", "/trial", "/speak", "/dictation"].map(
  (p) => ALL.find((d) => d.path === p)!,
);

function search(query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return ALL.filter((d) => {
    const hay = `${d.label} ${d.hint} ${d.keys ?? ""} ${d.path}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  }).slice(0, 6);
}

const STEPS = [
  { title: "Pick", body: "Type a test, a section or a skill — or tap a suggestion." },
  { title: "Answer", body: "One question at a time. Writing and speaking get AI feedback." },
  { title: "Review", body: "Misses land in Review. Scores build up on the Dashboard." },
];

export function HomePage() {
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => search(query), [query]);
  const open = results.length > 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!open) return;
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + dir + results.length) % results.length);
    } else if (e.key === "Enter" && open) {
      navigate(results[active].path);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div>
      <section className={`canvas-grid ${styles.hero}`}>
        <AsciiPond className={styles.pond} />
        <div className={styles.halo} aria-hidden="true" />

        <div className={styles.center}>
          <h1 className={styles.title}>what do you want to practise?</h1>

          <div className={`glass ${styles.box}`}>
            <input
              className={styles.input}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Try “reading”, “part 5” or “speaking”…"
              aria-label="Find a test, section or drill"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open ? `${listId}-${active}` : undefined}
              autoComplete="off"
              spellCheck={false}
            />

            {open ? (
              <ul id={listId} role="listbox" className={styles.results}>
                {results.map((d, i) => (
                  <li
                    key={d.path}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={styles.result}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      // Keep focus in the input until the route changes.
                      e.preventDefault();
                      navigate(d.path);
                    }}
                  >
                    <span>{d.label}</span>
                    <span className={styles.resultHint}>{d.hint}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.chips}>
                {STARTERS.map((d) => (
                  <Link key={d.path} to={d.path} className={styles.chip}>
                    {d.label}
                  </Link>
                ))}
              </div>
            )}

            <div className={styles.boxFoot} aria-hidden="true">
              {query && !open ? (
                <span>No match — try a section name like “listening”.</span>
              ) : (
                <span>
                  <kbd>↑↓</kbd> choose · <kbd>↵</kbd> open
                </span>
              )}
              <span>No sign-up · progress stays in this browser</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.steps} aria-label="How it works">
        {STEPS.map((s, i) => (
          <div key={s.title} className={styles.step}>
            <span className={styles.stepNum}>0{i + 1}</span>
            <h2 className={styles.stepTitle}>{s.title}</h2>
            <p className={styles.stepBody}>{s.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
