import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import table from "../../components/ui/ProblemTable.module.css";
import styles from "./ToeicMenuPage.module.css";

const parts = [
  {
    section: "Listening",
    tasks: [
      {
        path: "/toeic/part2",
        label: "Part 2: Question-Response",
        desc: "Listen to a question, choose the best response",
        count: "25 Qs",
      },
      {
        path: "/toeic/part3",
        label: "Part 3: Conversations",
        desc: "13 conversations with 3 questions each",
        count: "39 Qs",
      },
      {
        path: "/toeic/part4",
        label: "Part 4: Talks",
        desc: "10 talks with 3 questions each",
        count: "30 Qs",
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
        count: "30 Qs",
      },
      {
        path: "/toeic/part6",
        label: "Part 6: Text Completion",
        desc: "4 passages with 4 blank-fill questions each",
        count: "16 Qs",
      },
      {
        path: "/toeic/part7",
        label: "Part 7: Reading Comprehension",
        desc: "Single, double, and triple-passage questions",
        count: "54 Qs",
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
      {parts.map(({ section, tasks }) => (
        <div key={section} className={styles.tableWrapper}>
          <h3 className={styles.sectionTitle}>{section}</h3>
          <div className={table.container}>
            <div className={table.header}>
              <span>#</span>
              <span>Part</span>
              <span>Questions</span>
            </div>
            {tasks.map((task, i) => (
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
                <span className={table.badgeCell}>{task.count}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
