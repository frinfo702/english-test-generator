import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { ChevronRightIcon } from "../../components/ui/Icons";
import type { TaskId } from "../../hooks/useScoreHistory";
import styles from "./ToeicMenuPage.module.css";

interface PartTask {
  path: string;
  label: string;
  desc: string;
  taskId: TaskId;
}

interface PartSection {
  section: string;
  tasks: PartTask[];
}

const parts: PartSection[] = [
  {
    section: "Listening",
    tasks: [
      {
        path: "/toeic/part2",
        label: "Part 2: Question-Response",
        desc: "Listen to a question, choose the best response",
        taskId: "toeic/part2",
      },
      {
        path: "/toeic/part3",
        label: "Part 3: Conversations",
        desc: "Listen to a conversation and answer the questions",
        taskId: "toeic/part3",
      },
      {
        path: "/toeic/part4",
        label: "Part 4: Talks",
        desc: "Listen to a talk and answer the questions",
        taskId: "toeic/part4",
      },
    ],
  },
  {
    section: "Reading",
    tasks: [
      {
        path: "/toeic/part5",
        label: "Part 5: Incomplete Sentences",
        desc: "Grammar and vocabulary sentence blanks",
        taskId: "toeic/part5",
      },
      {
        path: "/toeic/part6",
        label: "Part 6: Text Completion",
        desc: "Choose the best words or sentence for each blank",
        taskId: "toeic/part6",
      },
      {
        path: "/toeic/part7",
        label: "Part 7: Reading Comprehension",
        desc: "Single, double, and triple-passage questions",
        taskId: "toeic/part7",
      },
    ],
  },
];

export function ToeicMenuPage() {
  const navigate = useNavigate();
  return (
    <div>
      <SectionHeader
        title="TOEIC L&amp;R"
        subtitle="Listening & Reading — choose a part to practice"
        backTo="/"
      />
      <div className={styles.sections}>
        {parts.map(({ section, tasks }) => (
          <div key={section} className={styles.partCard}>
            <h3 className={styles.sectionTitle}>{section}</h3>
            <div className={styles.taskList}>
              {tasks.map((task, i) => (
                <div
                  key={task.path}
                  className={styles.taskRow}
                  onClick={() => navigate(task.path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(task.path);
                    }
                  }}
                >
                  <span className={styles.taskRowIcon}>{i + 1}</span>
                  <span className={styles.taskRowContent}>
                    <div className={styles.taskRowLabel}>{task.label}</div>
                    <div className={styles.taskRowDesc}>{task.desc}</div>
                  </span>
                  <span className={styles.taskRowChevron}>
                    <ChevronRightIcon size={14} />
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
