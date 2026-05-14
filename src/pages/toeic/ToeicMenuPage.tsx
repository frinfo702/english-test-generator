import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import styles from "./ToeicMenuPage.module.css";

const listeningParts = [
  {
    path: "/toeic/part1",
    label: "Part 1",
    sublabel: "Photographs",
    desc: "6 photo description questions. Listen and choose the best description.",
    count: "6 Qs",
  },
  {
    path: "/toeic/part2",
    label: "Part 2",
    sublabel: "Question-Response",
    desc: "Listen to a question, choose the best response (3 choices).",
    count: "25 Qs",
  },
  {
    path: "/toeic/part3",
    label: "Part 3",
    sublabel: "Conversations",
    desc: "13 conversations with 3 questions each. Listen and answer.",
    count: "39 Qs",
  },
  {
    path: "/toeic/part4",
    label: "Part 4",
    sublabel: "Talks",
    desc: "10 talks with 3 questions each. Listen and answer.",
    count: "30 Qs",
  },
];

const readingParts = [
  {
    path: "/toeic/part5",
    label: "Part 5",
    sublabel: "Incomplete Sentences",
    desc: "30 short sentence blanks focused on grammar and vocabulary.",
    count: "30 Qs",
  },
  {
    path: "/toeic/part6",
    label: "Part 6",
    sublabel: "Text Completion",
    desc: "4 passages with 4 blank-fill questions each.",
    count: "16 Qs",
  },
  {
    path: "/toeic/part7",
    label: "Part 7",
    sublabel: "Reading Comprehension",
    desc: "Single, double, and triple-passage reading questions.",
    count: "54 Qs",
  },
];

function PartCard({
  path,
  label,
  sublabel,
  desc,
  count,
}: {
  path: string;
  label: string;
  sublabel: string;
  desc: string;
  count: string;
}) {
  const navigate = useNavigate();
  return (
    <div
      className={styles.card}
      onClick={() => navigate(path)}
    >
      <div className={styles.cardTop}>
        <span className={styles.badge}>{count}</span>
      </div>
      <div className={styles.labelRow}>
        <span className={styles.dot} style={{ background: "var(--color-toeic)" }} />
        <h2 className={styles.label}>{label}</h2>
      </div>
      <p className={styles.sublabel}>{sublabel}</p>
      <p className={styles.desc}>{desc}</p>
    </div>
  );
}

export function ToeicMenuPage() {
  return (
    <div>
      <SectionHeader
        title="TOEIC Practice"
        subtitle="Listening & Reading — choose a part to practice"
        backTo="/"
      />
      <h3 className={styles.sectionTitle}>Listening</h3>
      <div className={styles.grid}>
        {listeningParts.map((part) => (
          <PartCard key={part.path} {...part} />
        ))}
      </div>
      <h3 className={styles.sectionTitle}>Reading</h3>
      <div className={styles.grid}>
        {readingParts.map((part) => (
          <PartCard key={part.path} {...part} />
        ))}
      </div>
    </div>
  );
}
