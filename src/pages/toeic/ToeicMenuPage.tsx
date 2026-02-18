import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import styles from "./ToeicMenuPage.module.css";

const parts = [
  {
    path: "/toeic/part5",
    label: "Part 5",
    sublabel: "Incomplete Sentences",
    desc: "30問の短文穴埋め。文法・語彙の選択問題。",
    count: "30問",
  },
  {
    path: "/toeic/part6",
    label: "Part 6",
    sublabel: "Text Completion",
    desc: "4つの文書、各4問の空欄補充問題。",
    count: "16問",
  },
  {
    path: "/toeic/part7",
    label: "Part 7",
    sublabel: "Reading Comprehension",
    desc: "シングル・ダブル・トリプルパッセージの長文読解。",
    count: "54問",
  },
];

export function ToeicMenuPage() {
  const navigate = useNavigate();
  return (
    <div>
      <SectionHeader
        title="TOEIC Reading"
        subtitle="Part 5・6・7 — パートを選択してください"
        backTo="/"
      />
      <div className={styles.grid}>
        {parts.map((part) => (
          <div
            key={part.path}
            className={styles.card}
            onClick={() => navigate(part.path)}
          >
            <div className={styles.badge}>{part.count}</div>
            <h2 className={styles.label}>{part.label}</h2>
            <p className={styles.sublabel}>{part.sublabel}</p>
            <p className={styles.desc}>{part.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
