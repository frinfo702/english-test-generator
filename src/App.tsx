import { HashRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { ToeflMenuPage } from "./pages/toefl/ToeflMenuPage";
import { ToeicMenuPage } from "./pages/toeic/ToeicMenuPage";
import { CompleteWordsPage } from "./pages/toefl/reading/CompleteWordsPage";
import { ReadDailyLifePage } from "./pages/toefl/reading/ReadDailyLifePage";
import { ReadAcademicPage } from "./pages/toefl/reading/ReadAcademicPage";
import { BuildSentencePage } from "./pages/toefl/writing/BuildSentencePage";
import { WriteEmailPage } from "./pages/toefl/writing/WriteEmailPage";
import { WriteDiscussionPage } from "./pages/toefl/writing/WriteDiscussionPage";
import { ListenRepeatPage } from "./pages/toefl/speaking/ListenRepeatPage";
import { TakeInterviewPage } from "./pages/toefl/speaking/TakeInterviewPage";
import { ShadowingPage } from "./pages/ShadowingPage";
import {
  ConversationPage,
  LecturePage,
  AnnouncementPage,
} from "./pages/toefl/listening/ListeningTaskPage";
import { ListenResponsePage } from "./pages/toefl/listening/ListenResponsePage";
import { Part2Page } from "./pages/toeic/Part2Page";
import { Part3Page } from "./pages/toeic/Part3Page";
import { Part4Page } from "./pages/toeic/Part4Page";
import { Part5Page } from "./pages/toeic/Part5Page";
import { Part6Page } from "./pages/toeic/Part6Page";
import { Part7Page } from "./pages/toeic/Part7Page";
import { QuestionSelectorPage } from "./components/question/QuestionSelectorPage";
import type { ReactElement } from "react";
import type { TaskId } from "./hooks/useScoreHistory";

interface TaskRoute {
  basePath: string;
  taskId: TaskId;
  title: string;
  subtitle: string;
  backTo: string;
  page: ReactElement;
}

const taskRoutes: TaskRoute[] = [
  {
    basePath: "/toefl/reading/complete-words",
    taskId: "toefl/reading/complete-words",
    title: "Complete the Words",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <CompleteWordsPage />,
  },
  {
    basePath: "/toefl/reading/daily-life",
    taskId: "toefl/reading/daily-life",
    title: "Read in Daily Life",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <ReadDailyLifePage />,
  },
  {
    basePath: "/toefl/reading/academic",
    taskId: "toefl/reading/academic",
    title: "Read an Academic Passage",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <ReadAcademicPage />,
  },
  {
    basePath: "/toefl/writing/build-sentence",
    taskId: "toefl/writing/build-sentence",
    title: "Build a Sentence",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <BuildSentencePage />,
  },
  {
    basePath: "/toefl/writing/email",
    taskId: "toefl/writing/email",
    title: "Write an Email",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <WriteEmailPage />,
  },
  {
    basePath: "/toefl/writing/discussion",
    taskId: "toefl/writing/discussion",
    title: "Write for an Academic Discussion",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <WriteDiscussionPage />,
  },
  {
    basePath: "/toefl/speaking/listen-repeat",
    taskId: "toefl/speaking/listen-repeat",
    title: "Listen and Repeat",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <ListenRepeatPage />,
  },
  {
    basePath: "/toefl/speaking/interview",
    taskId: "toefl/speaking/interview",
    title: "Take an Interview",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <TakeInterviewPage />,
  },
  {
    basePath: "/toefl/listening/conversation",
    taskId: "toefl/listening/conversation",
    title: "Listen to a Conversation",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <ConversationPage />,
  },
  {
    basePath: "/toefl/listening/lecture",
    taskId: "toefl/listening/lecture",
    title: "Listen to a Lecture",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <LecturePage />,
  },
  {
    basePath: "/toefl/listening/response",
    taskId: "toefl/listening/response",
    title: "Listen and Choose a Response",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <ListenResponsePage />,
  },
  {
    basePath: "/toefl/listening/announcement",
    taskId: "toefl/listening/announcement",
    title: "Listen to an Announcement",
    subtitle: "Select a question number or start with random.",
    backTo: "/toefl",
    page: <AnnouncementPage />,
  },
  {
    basePath: "/toeic/part2",
    taskId: "toeic/part2",
    title: "Part 2: Question-Response",
    subtitle: "Select a question number or start with random.",
    backTo: "/toeic",
    page: <Part2Page />,
  },
  {
    basePath: "/toeic/part3",
    taskId: "toeic/part3",
    title: "Part 3: Conversations",
    subtitle: "Select a question number or start with random.",
    backTo: "/toeic",
    page: <Part3Page />,
  },
  {
    basePath: "/toeic/part4",
    taskId: "toeic/part4",
    title: "Part 4: Talks",
    subtitle: "Select a question number or start with random.",
    backTo: "/toeic",
    page: <Part4Page />,
  },
  {
    basePath: "/toeic/part5",
    taskId: "toeic/part5",
    title: "Part 5: Incomplete Sentences",
    subtitle: "Select a question number or start with random.",
    backTo: "/toeic",
    page: <Part5Page />,
  },
  {
    basePath: "/toeic/part6",
    taskId: "toeic/part6",
    title: "Part 6: Text Completion",
    subtitle: "Select a question number or start with random.",
    backTo: "/toeic",
    page: <Part6Page />,
  },
  {
    basePath: "/toeic/part7",
    taskId: "toeic/part7",
    title: "Part 7: Reading Comprehension",
    subtitle: "Select a question number or start with random.",
    backTo: "/toeic",
    page: <Part7Page />,
  },
  {
    basePath: "/shadowing",
    taskId: "shadowing",
    title: "Shadowing Practice",
    subtitle: "Select a shadowing set or start with a random one.",
    backTo: "/",
    page: <ShadowingPage />,
  },
];

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/toefl" element={<ToeflMenuPage />} />
          <Route path="/toeic" element={<ToeicMenuPage />} />

          {taskRoutes.map((r) => (
            <Route key={r.basePath}>
              <Route
                path={r.basePath}
                element={
                  <QuestionSelectorPage
                    taskId={r.taskId}
                    title={r.title}
                    subtitle={r.subtitle}
                    backTo={r.backTo}
                    basePath={r.basePath}
                  />
                }
              />
              <Route path={`${r.basePath}/:questionNumber`} element={r.page} />
            </Route>
          ))}
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
