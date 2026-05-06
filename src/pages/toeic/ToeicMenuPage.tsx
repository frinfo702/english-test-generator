import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import styles from "./ToeicMenuPage.module.css";

const parts = [
  {
    path: "/toeic/part5",
    label: "Part 5",
    sublabel: "Incomplete Sentences",
    desc: "30 short sentence blanks focused on grammar and vocabulary.",
    count: "30 Qs",
    color: "var(--color-toeic)",
  },
  {
    path: "/toeic/part6",
    label: "Part 6",
    sublabel: "Text Completion",
    desc: "4 passages with 4 blank-fill questions each.",
    count: "16 Qs",
    color: "var(--color-toeic)",
  },
  {
    path: "/toeic/part7",
    label: "Part 7",
    sublabel: "Reading Comprehension",
    desc: "Single, double, and triple-passage reading questions.",
    count: "54 Qs",
    color: "var(--color-toeic)",
  },
];

export function ToeicMenuPage() {
  const navigate = useNavigate();
  return (
    <div>
      <SectionHeader
        title="TOEIC Reading"
        subtitle="Part 5 / 6 / 7 — choose a part to practice"
        backTo="/"
      />
      <div className={styles.grid}>
        {parts.map((part) => (
          <div
            key={part.path}
            className={styles.card}
            onClick={() => navigate(part.path)}
          >
            <div className={styles.cardTop}>
              <span className={styles.badge}>{part.count}</span>
            </div>
            <div className={styles.labelRow}>
              <span className={styles.dot} style={{ background: part.color }} />
              <h2 className={styles.label}>{part.label}</h2>
            </div>
            <p className={styles.sublabel}>{part.sublabel}</p>
            <p className={styles.desc}>{part.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
