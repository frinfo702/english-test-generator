import { SectionHeader } from "../components/layout/SectionHeader";
import {
  TaskMenu,
  type TaskMenuSection,
} from "../components/layout/TaskMenu";

/** Where "Start practice" lands: every test, speaking mode and drill in one list. */
const sections: TaskMenuSection[] = [
  {
    key: "tests",
    label: "Tests",
    color: "var(--color-ink)",
    items: [
      {
        label: "TOEFL iBT 2026",
        desc: "Reading, Writing, Listening and Speaking tasks",
        path: "/toefl",
      },
      {
        label: "TOEIC L&R",
        desc: "Listening and Reading, Parts 2–7",
        path: "/toeic",
      },
      {
        label: "Practice Test",
        desc: "A timed TOEFL test, scored 1–6",
        path: "/trial",
      },
    ],
  },
  {
    key: "speak",
    label: "Speaking",
    color: "var(--color-speaking)",
    items: [
      {
        label: "Speaking Loop",
        desc: "Talk, see natural English, then say it again",
        path: "/speak",
      },
      {
        label: "Conversation",
        desc: "An AI partner that asks back",
        path: "/speak/talk",
      },
      {
        label: "Chunk Cards",
        desc: "Useful phrases on spaced recall, out loud",
        path: "/speak/cards",
      },
    ],
  },
  {
    key: "drills",
    label: "Daily drills",
    color: "var(--color-ink)",
    items: [
      {
        label: "Shadowing",
        desc: "Speak along with a recording",
        path: "/shadowing",
      },
      {
        label: "Dictation",
        desc: "Listen, then put the words in order",
        path: "/dictation",
      },
      {
        label: "Instant Composition",
        desc: "See the Japanese, say the English",
        path: "/instant-composition",
      },
    ],
  },
];

export function PracticePage() {
  return (
    <div>
      <SectionHeader
        title="Practice"
        subtitle="Pick a test, a speaking mode or a daily drill."
        backTo="/"
      />
      <TaskMenu sections={sections} />
    </div>
  );
}
