import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import styles from "./ToeflMenuPage.module.css";

const sections = [
  {
    key: "reading",
    label: "Reading",
    color: "#0071bc",
    tasks: [
      { label: "Complete the Words", path: "/toefl/reading/complete-words", desc: "学術パラグラフの単語補完（10問）" },
      { label: "Read in Daily Life", path: "/toefl/reading/daily-life", desc: "日常テキスト読解・アダプティブ形式" },
      { label: "Read an Academic Passage", path: "/toefl/reading/academic", desc: "約200語の学術パッセージ（5問）" },
    ],
  },
  {
    key: "writing",
    label: "Writing",
    color: "#0e7a4e",
    tasks: [
      { label: "Build a Sentence", path: "/toefl/writing/build-sentence", desc: "語句並べ替えで文を構築（10問）" },
      { label: "Write an Email", path: "/toefl/writing/email", desc: "シナリオに基づきメール作成（7分）" },
      { label: "Write for an Academic Discussion", path: "/toefl/writing/discussion", desc: "教授の質問に対して意見を記述（10分）" },
    ],
  },
  {
    key: "speaking",
    label: "Speaking",
    color: "#7c3aed",
    tasks: [
      { label: "Listen and Repeat", path: "/toefl/speaking/listen-repeat", desc: "文を見て覚えてタイピングで再現（7問）" },
      { label: "Take an Interview", path: "/toefl/speaking/interview", desc: "インタビュー質問に即答（4問×45秒）" },
    ],
  },
];

export function ToeflMenuPage() {
  const navigate = useNavigate();
  return (
    <div>
      <SectionHeader
        title="TOEFL iBT 2026"
        subtitle="2026年1月新形式 — セクションとタスクを選択してください"
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
