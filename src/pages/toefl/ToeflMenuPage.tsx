import { SectionHeader } from "../../components/layout/SectionHeader";
import {
  TaskMenu,
  type TaskMenuSection,
} from "../../components/layout/TaskMenu";

const sections: TaskMenuSection[] = [
  {
    key: "reading",
    label: "Reading",
    color: "var(--color-reading)",
    items: [
      {
        label: "Complete the Words",
        desc: "Fill in missing letters in an academic paragraph",
        path: "/toefl/reading/complete-words",
      },
      {
        label: "Read in Daily Life",
        desc: "Everyday texts — notices, messages, forms",
        path: "/toefl/reading/daily-life",
        meta: "Adaptive",
      },
      {
        label: "Read an Academic Passage",
        desc: "A short passage with five questions",
        path: "/toefl/reading/academic",
        meta: "5 questions",
      },
    ],
  },
  {
    key: "writing",
    label: "Writing",
    color: "var(--color-writing)",
    items: [
      {
        label: "Build a Sentence",
        desc: "Reorder chunks into a correct sentence",
        path: "/toefl/writing/build-sentence",
      },
      {
        label: "Write an Email",
        desc: "Respond to a scenario in a short email",
        path: "/toefl/writing/email",
        meta: "7 min",
      },
      {
        label: "Academic Discussion",
        desc: "Post your opinion in a class discussion",
        path: "/toefl/writing/discussion",
        meta: "10 min",
      },
    ],
  },
  {
    key: "listening",
    label: "Listening",
    color: "var(--color-listening)",
    items: [
      {
        label: "Listen to a Conversation",
        desc: "Campus conversation with comprehension questions",
        path: "/toefl/listening/conversation",
      },
      {
        label: "Listen to a Lecture",
        desc: "Academic lecture with comprehension questions",
        path: "/toefl/listening/lecture",
      },
      {
        label: "Choose a Response",
        desc: "Pick the best reply to a short utterance",
        path: "/toefl/listening/response",
      },
      {
        label: "Listen to an Announcement",
        desc: "Campus announcement with comprehension questions",
        path: "/toefl/listening/announcement",
      },
    ],
  },
  {
    key: "speaking",
    label: "Speaking",
    color: "var(--color-speaking)",
    items: [
      {
        label: "Listen and Repeat",
        desc: "Hear a sentence, then say it back into the mic",
        path: "/toefl/speaking/listen-repeat",
      },
      {
        label: "Take an Interview",
        desc: "Answer four interview questions on the spot",
        path: "/toefl/speaking/interview",
        meta: "4 × 45 s",
      },
    ],
  },
];

export function ToeflMenuPage() {
  return (
    <div>
      <SectionHeader
        title="TOEFL iBT 2026"
        subtitle="January 2026 format — choose a section and task."
        backTo="/"
      />
      <TaskMenu sections={sections} />
    </div>
  );
}
