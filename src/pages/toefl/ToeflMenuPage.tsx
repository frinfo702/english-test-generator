import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { useTaskQuestionCounts } from "../../hooks/useTaskQuestionCounts";
import type { TaskId } from "../../hooks/useScoreHistory";
import table from "../../components/ui/ProblemTable.module.css";
import styles from "./ToeflMenuPage.module.css";

interface TaskEntry {
  label: string;
  path: string;
  desc: string;
  taskId: TaskId;
  unit: string;
}

interface SectionEntry {
  key: string;
  label: string;
  color: string;
  tasks: TaskEntry[];
}

const sections: SectionEntry[] = [
  {
    key: "reading",
    label: "Reading",
    color: "var(--color-reading)",
    tasks: [
      {
        label: "Complete the Words",
        path: "/toefl/reading/complete-words",
        desc: "Fill in missing words in an academic paragraph",
        taskId: "toefl/reading/complete-words",
        unit: "item",
      },
      {
        label: "Read in Daily Life",
        path: "/toefl/reading/daily-life",
        desc: "Answer questions about everyday texts",
        taskId: "toefl/reading/daily-life",
        unit: "question",
      },
      {
        label: "Read an Academic Passage",
        path: "/toefl/reading/academic",
        desc: "Answer questions about an academic passage",
        taskId: "toefl/reading/academic",
        unit: "question",
      },
    ],
  },
  {
    key: "writing",
    label: "Writing",
    color: "var(--color-writing)",
    tasks: [
      {
        label: "Build a Sentence",
        path: "/toefl/writing/build-sentence",
        desc: "Reorder chunks to build correct responses",
        taskId: "toefl/writing/build-sentence",
        unit: "item",
      },
      {
        label: "Write an Email",
        path: "/toefl/writing/email",
        desc: "Compose an email based on a given scenario",
        taskId: "toefl/writing/email",
        unit: "prompt",
      },
      {
        label: "Academic Discussion",
        path: "/toefl/writing/discussion",
        desc: "Write your opinion on a professor's prompt",
        taskId: "toefl/writing/discussion",
        unit: "prompt",
      },
    ],
  },
  {
    key: "listening",
    label: "Listening",
    color: "var(--color-listening)",
    tasks: [
      {
        label: "Listen to a Conversation",
        path: "/toefl/listening/conversation",
        desc: "Campus conversation with questions",
        taskId: "toefl/listening/conversation",
        unit: "question",
      },
      {
        label: "Listen to a Lecture",
        path: "/toefl/listening/lecture",
        desc: "Academic lecture with questions",
        taskId: "toefl/listening/lecture",
        unit: "question",
      },
      {
        label: "Choose a Response",
        path: "/toefl/listening/response",
        desc: "Select the best response to utterances",
        taskId: "toefl/listening/response",
        unit: "item",
      },
      {
        label: "Listen to an Announcement",
        path: "/toefl/listening/announcement",
        desc: "Campus announcements with questions",
        taskId: "toefl/listening/announcement",
        unit: "question",
      },
    ],
  },
  {
    key: "speaking",
    label: "Speaking",
    color: "var(--color-speaking)",
    tasks: [
      {
        label: "Listen and Repeat",
        path: "/toefl/speaking/listen-repeat",
        desc: "Memorize and reproduce sentences",
        taskId: "toefl/speaking/listen-repeat",
        unit: "item",
      },
      {
        label: "Take an Interview",
        path: "/toefl/speaking/interview",
        desc: "Answer interview questions on the spot",
        taskId: "toefl/speaking/interview",
        unit: "question",
      },
    ],
  },
];

function formatMeta(count: number | null | undefined, unit: string): string {
  if (count == null) return "—";
  return `${count} ${unit}${count !== 1 ? "s" : ""}`;
}

export function ToeflMenuPage() {
  const navigate = useNavigate();
  const taskIds = sections.flatMap((s) => s.tasks.map((t) => t.taskId));
  const counts = useTaskQuestionCounts(taskIds);
  return (
    <div>
      <SectionHeader
        title="TOEFL iBT 2026"
        subtitle="January 2026 format — select a section and task to practice"
        backTo="/"
      />
      <div className={styles.sections}>
        {sections.map((section) => (
          <div key={section.key} className={styles.section}>
            <div
              className={styles.sectionLabel}
              style={{ color: section.color }}
            >
              <span
                className={styles.sectionDot}
                style={{ background: section.color }}
              />
              {section.label}
            </div>
            <div className={table.container}>
              <div className={table.header}>
                <span>#</span>
                <span>Task</span>
                <span>Scale</span>
              </div>
              {section.tasks.map((task, i) => (
                <div
                  key={task.path}
                  className={table.row}
                  onClick={() => navigate(task.path)}
                >
                  <span className={table.statusNone}>{i + 1}</span>
                  <span className={table.titleCell}>
                    {task.label}
                    <div className={table.titleMeta}>{task.desc}</div>
                  </span>
                  <span className={table.badgeCell}>
                    {formatMeta(counts[task.taskId], task.unit)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
