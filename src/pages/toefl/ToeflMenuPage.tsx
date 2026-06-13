import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import type { TaskId } from "../../hooks/useScoreHistory";
import table from "../../components/ui/ProblemTable.module.css";
import styles from "./ToeflMenuPage.module.css";

interface TaskEntry {
  label: string;
  path: string;
  desc: string;
  taskId: TaskId;
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
      },
      {
        label: "Read in Daily Life",
        path: "/toefl/reading/daily-life",
        desc: "Answer questions about everyday texts",
        taskId: "toefl/reading/daily-life",
      },
      {
        label: "Read an Academic Passage",
        path: "/toefl/reading/academic",
        desc: "Answer questions about an academic passage",
        taskId: "toefl/reading/academic",
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
      },
      {
        label: "Write an Email",
        path: "/toefl/writing/email",
        desc: "Compose an email based on a given scenario",
        taskId: "toefl/writing/email",
      },
      {
        label: "Academic Discussion",
        path: "/toefl/writing/discussion",
        desc: "Write your opinion on a professor's prompt",
        taskId: "toefl/writing/discussion",
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
      },
      {
        label: "Listen to a Lecture",
        path: "/toefl/listening/lecture",
        desc: "Academic lecture with questions",
        taskId: "toefl/listening/lecture",
      },
      {
        label: "Choose a Response",
        path: "/toefl/listening/response",
        desc: "Select the best response to utterances",
        taskId: "toefl/listening/response",
      },
      {
        label: "Listen to an Announcement",
        path: "/toefl/listening/announcement",
        desc: "Campus announcements with questions",
        taskId: "toefl/listening/announcement",
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
      },
      {
        label: "Take an Interview",
        path: "/toefl/speaking/interview",
        desc: "Answer interview questions on the spot",
        taskId: "toefl/speaking/interview",
      },
    ],
  },
];

export function ToeflMenuPage() {
  const navigate = useNavigate();
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
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
