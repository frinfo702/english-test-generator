import { SectionHeader } from "../../components/layout/SectionHeader";
import {
  TaskMenu,
  type TaskMenuSection,
} from "../../components/layout/TaskMenu";

const sections: TaskMenuSection[] = [
  {
    key: "listening",
    label: "Listening",
    color: "var(--color-listening)",
    items: [
      {
        label: "Part 2: Question-Response",
        desc: "Hear a question, choose the best response",
        path: "/toeic/part2",
      },
      {
        label: "Part 3: Conversations",
        desc: "Conversations with two or three questions each",
        path: "/toeic/part3",
      },
      {
        label: "Part 4: Talks",
        desc: "Short talks with two or three questions each",
        path: "/toeic/part4",
      },
    ],
  },
  {
    key: "reading",
    label: "Reading",
    color: "var(--color-reading)",
    items: [
      {
        label: "Part 5: Incomplete Sentences",
        desc: "Grammar and vocabulary sentence blanks",
        path: "/toeic/part5",
        meta: "30 questions",
      },
      {
        label: "Part 6: Text Completion",
        desc: "Four passages, four blanks each",
        path: "/toeic/part6",
        meta: "16 questions",
      },
      {
        label: "Part 7: Reading Comprehension",
        desc: "Single, double and triple passages",
        path: "/toeic/part7",
        meta: "54 questions",
      },
    ],
  },
];

export function ToeicMenuPage() {
  return (
    <div>
      <SectionHeader
        title="TOEIC L&R"
        subtitle="Listening and Reading — choose a part to practice."
        backTo="/"
      />
      <TaskMenu sections={sections} />
    </div>
  );
}
