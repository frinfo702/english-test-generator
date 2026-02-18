import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import styles from "./ToeflMenuPage.module.css";

const sections = [
  {
    key: "reading",
    label: "Reading",
    color: "#0071bc",
    tasks: [
      { label: "Complete the Words", path: "/toefl/reading/complete-words", desc: "Complete missing words in an academic paragraph (10 items)." },
      { label: "Read in Daily Life", path: "/toefl/reading/daily-life", desc: "Adaptive reading with everyday text passages." },
      { label: "Read an Academic Passage", path: "/toefl/reading/academic", desc: "Read an academic passage and answer 5 questions." },
    ],
  },
  {
    key: "writing",
    label: "Writing",
    color: "#0e7a4e",
    tasks: [
      { label: "Build a Sentence", path: "/toefl/writing/build-sentence", desc: "Reorder chunks to build responses (10 items)." },
      { label: "Write an Email", path: "/toefl/writing/email", desc: "Write an email based on a scenario (7 minutes)." },
      { label: "Write for an Academic Discussion", path: "/toefl/writing/discussion", desc: "Write your opinion on a professor's prompt (10 minutes)." },
    ],
  },
  {
    key: "speaking",
    label: "Speaking",
    color: "#7c3aed",
    tasks: [
      { label: "Listen and Repeat", path: "/toefl/speaking/listen-repeat", desc: "Memorize and reproduce sentences by typing (7 items)." },
      { label: "Take an Interview", path: "/toefl/speaking/interview", desc: "Answer interview questions on the spot (4 x 45 sec)." },
    ],
  },
];

export function ToeflMenuPage() {
  const navigate = useNavigate();
  return (
    <div>
      <SectionHeader
        title="TOEFL iBT 2026"
        subtitle="January 2026 format update — choose a section and task"
        backTo="/"
      />
      <div className={styles.sections}>
        {sections.map((section) => (
          <div key={section.key} className={styles.section}>
            <h2 className={styles.sectionTitle} style={{ color: section.color }}>
              {section.label}
            </h2>
            <div className={styles.tasks}>
              {section.tasks.map((task) => (
                <div
                  key={task.path}
                  className={styles.taskCard}
                  onClick={() => navigate(task.path)}
                  style={{ borderColor: section.color + "33" }}
                >
                  <span className={styles.taskLabel}>{task.label}</span>
                  <span className={styles.taskDesc}>{task.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
