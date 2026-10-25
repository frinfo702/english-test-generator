import { Fragment, Suspense, lazy, type ComponentType } from "react";
import {
  HashRouter,
  Navigate,
  Routes,
  Route,
  useParams,
} from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { ToeflMenuPage } from "./pages/toefl/ToeflMenuPage";
import { ToeicMenuPage } from "./pages/toeic/ToeicMenuPage";
import { QuestionSelectorPage } from "./components/question/QuestionSelectorPage";
import type { ReactElement, ReactNode } from "react";
import type { TaskId } from "./hooks/useScoreHistory";
import { RECALL_PATH } from "./lib/review";

/** Route pages load on first visit; the shell and home index stay in the entry. */
function lazyNamed<K extends string, P extends object>(
  load: () => Promise<Record<K, ComponentType<P>>>,
  name: K,
) {
  return lazy(() => load().then((m) => ({ default: m[name] })));
}

const DashboardPage = lazyNamed(
  () => import("./pages/DashboardPage"),
  "DashboardPage",
);
const CompleteWordsPage = lazyNamed(
  () => import("./pages/toefl/reading/CompleteWordsPage"),
  "CompleteWordsPage",
);
const ReadDailyLifePage = lazyNamed(
  () => import("./pages/toefl/reading/ReadDailyLifePage"),
  "ReadDailyLifePage",
);
const ReadAcademicPage = lazyNamed(
  () => import("./pages/toefl/reading/ReadAcademicPage"),
  "ReadAcademicPage",
);
const BuildSentencePage = lazyNamed(
  () => import("./pages/toefl/writing/BuildSentencePage"),
  "BuildSentencePage",
);
const WriteEmailPage = lazyNamed(
  () => import("./pages/toefl/writing/WriteEmailPage"),
  "WriteEmailPage",
);
const WriteDiscussionPage = lazyNamed(
  () => import("./pages/toefl/writing/WriteDiscussionPage"),
  "WriteDiscussionPage",
);
const ListenRepeatPage = lazyNamed(
  () => import("./pages/toefl/speaking/ListenRepeatPage"),
  "ListenRepeatPage",
);
const TakeInterviewPage = lazyNamed(
  () => import("./pages/toefl/speaking/TakeInterviewPage"),
  "TakeInterviewPage",
);
const ShadowingPage = lazyNamed(
  () => import("./pages/ShadowingPage"),
  "ShadowingPage",
);
const DictationPage = lazyNamed(
  () => import("./pages/DictationPage"),
  "DictationPage",
);
const InstantCompositionPage = lazyNamed(
  () => import("./pages/InstantCompositionPage"),
  "InstantCompositionPage",
);
const ConversationPage = lazyNamed(
  () => import("./pages/toefl/listening/ListeningTaskPage"),
  "ConversationPage",
);
const LecturePage = lazyNamed(
  () => import("./pages/toefl/listening/ListeningTaskPage"),
  "LecturePage",
);
const AnnouncementPage = lazyNamed(
  () => import("./pages/toefl/listening/ListeningTaskPage"),
  "AnnouncementPage",
);
const ListenResponsePage = lazyNamed(
  () => import("./pages/toefl/listening/ListenResponsePage"),
  "ListenResponsePage",
);
const Part2Page = lazyNamed(
  () => import("./pages/toeic/Part2Page"),
  "Part2Page",
);
const Part3Page = lazyNamed(
  () => import("./pages/toeic/Part3Page"),
  "Part3Page",
);
const Part4Page = lazyNamed(
  () => import("./pages/toeic/Part4Page"),
  "Part4Page",
);
const Part5Page = lazyNamed(
  () => import("./pages/toeic/Part5Page"),
  "Part5Page",
);
const Part6Page = lazyNamed(
  () => import("./pages/toeic/Part6Page"),
  "Part6Page",
);
const Part7Page = lazyNamed(
  () => import("./pages/toeic/Part7Page"),
  "Part7Page",
);
const ResultPage = lazyNamed(
  () => import("./pages/results/ResultPage"),
  "ResultPage",
);
const TrialHomePage = lazyNamed(
  () => import("./pages/trial/TrialHomePage"),
  "TrialHomePage",
);
const TrialRunPage = lazyNamed(
  () => import("./pages/trial/TrialRunPage"),
  "TrialRunPage",
);
const TrialReportPage = lazyNamed(
  () => import("./pages/trial/TrialReportPage"),
  "TrialReportPage",
);
const AiScoringPage = lazyNamed(
  () => import("./pages/updates/AiScoringPage"),
  "AiScoringPage",
);
const IntroducePage = lazyNamed(
  () => import("./pages/updates/IntroducePage"),
  "IntroducePage",
);
const RedesignPage = lazyNamed(
  () => import("./pages/updates/RedesignPage"),
  "RedesignPage",
);
const RecallFrame = lazyNamed(
  () => import("./pages/review/ReviewPage"),
  "RecallFrame",
);
const ReviewPage = lazyNamed<"ReviewPage", object>(
  () => import("./pages/review/ReviewPage"),
  "ReviewPage",
);
const SettingsPage = lazyNamed(
  () => import("./pages/settings/SettingsPage"),
  "SettingsPage",
);

interface TaskRoute {
  basePath: string;
  taskId: TaskId;
  title: string;
  subtitle?: string;
  backTo: string;
  page: ReactElement;
}

const taskRoutes: TaskRoute[] = [
  {
    basePath: "/toefl/reading/complete-words",
    taskId: "toefl/reading/complete-words",
    title: "Complete the Words",
    backTo: "/toefl",
    page: <CompleteWordsPage />,
  },
  {
    basePath: "/toefl/reading/daily-life",
    taskId: "toefl/reading/daily-life",
    title: "Read in Daily Life",
    backTo: "/toefl",
    page: <ReadDailyLifePage />,
  },
  {
    basePath: "/toefl/reading/academic",
    taskId: "toefl/reading/academic",
    title: "Read an Academic Passage",
    backTo: "/toefl",
    page: <ReadAcademicPage />,
  },
  {
    basePath: "/toefl/writing/build-sentence",
    taskId: "toefl/writing/build-sentence",
    title: "Build a Sentence",
    backTo: "/toefl",
    page: <BuildSentencePage />,
  },
  {
    basePath: "/toefl/writing/email",
    taskId: "toefl/writing/email",
    title: "Write an Email",
    backTo: "/toefl",
    page: <WriteEmailPage />,
  },
  {
    basePath: "/toefl/writing/discussion",
    taskId: "toefl/writing/discussion",
    title: "Write for an Academic Discussion",
    backTo: "/toefl",
    page: <WriteDiscussionPage />,
  },
  {
    basePath: "/toefl/speaking/listen-repeat",
    taskId: "toefl/speaking/listen-repeat",
    title: "Listen and Repeat",
    backTo: "/toefl",
    page: <ListenRepeatPage />,
  },
  {
    basePath: "/toefl/speaking/interview",
    taskId: "toefl/speaking/interview",
    title: "Take an Interview",
    backTo: "/toefl",
    page: <TakeInterviewPage />,
  },
  {
    basePath: "/toefl/listening/conversation",
    taskId: "toefl/listening/conversation",
    title: "Listen to a Conversation",
    backTo: "/toefl",
    page: <ConversationPage />,
  },
  {
    basePath: "/toefl/listening/lecture",
    taskId: "toefl/listening/lecture",
    title: "Listen to a Lecture",
    backTo: "/toefl",
    page: <LecturePage />,
  },
  {
    basePath: "/toefl/listening/response",
    taskId: "toefl/listening/response",
    title: "Listen and Choose a Response",
    backTo: "/toefl",
    page: <ListenResponsePage />,
  },
  {
    basePath: "/toefl/listening/announcement",
    taskId: "toefl/listening/announcement",
    title: "Listen to an Announcement",
    backTo: "/toefl",
    page: <AnnouncementPage />,
  },
  {
    basePath: "/toeic/part2",
    taskId: "toeic/part2",
    title: "Part 2: Question-Response",
    backTo: "/toeic",
    page: <Part2Page />,
  },
  {
    basePath: "/toeic/part3",
    taskId: "toeic/part3",
    title: "Part 3: Conversations",
    backTo: "/toeic",
    page: <Part3Page />,
  },
  {
    basePath: "/toeic/part4",
    taskId: "toeic/part4",
    title: "Part 4: Talks",
    backTo: "/toeic",
    page: <Part4Page />,
  },
  {
    basePath: "/toeic/part5",
    taskId: "toeic/part5",
    title: "Part 5: Incomplete Sentences",
    backTo: "/toeic",
    page: <Part5Page />,
  },
  {
    basePath: "/toeic/part6",
    taskId: "toeic/part6",
    title: "Part 6: Text Completion",
    backTo: "/toeic",
    page: <Part6Page />,
  },
  {
    basePath: "/toeic/part7",
    taskId: "toeic/part7",
    title: "Part 7: Reading Comprehension",
    backTo: "/toeic",
    page: <Part7Page />,
  },
  {
    basePath: "/shadowing",
    taskId: "shadowing",
    title: "Shadowing Practice",
    backTo: "/",
    page: <ShadowingPage />,
  },
  {
    basePath: "/dictation",
    taskId: "dictation",
    title: "Dictation Practice",
    backTo: "/",
    page: <DictationPage />,
  },
  {
    basePath: "/instant-composition",
    taskId: "instant-composition",
    title: "Instant Composition",
    subtitle:
      "Units build up from the present tense to seminar and workplace English.",
    backTo: "/",
    page: <InstantCompositionPage />,
  },
];

const trialPages = Object.fromEntries(
  taskRoutes.map((r) => [r.taskId, r.page]),
) as Partial<Record<TaskId, ReactElement>>;

/** Remounts the page per question so "Next Question" starts from clean state. */
function KeyedByQuestion({ children }: { children: ReactNode }) {
  const { questionId = "" } = useParams<{ questionId: string }>();
  return <Fragment key={questionId}>{children}</Fragment>;
}

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        {/* No fallback: route changes run in a transition, so the old page
            stays up until the new chunk is in instead of flashing a spinner. */}
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/learn" element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/results/:attemptId" element={<ResultPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/toefl" element={<ToeflMenuPage />} />
            <Route path="/toeic" element={<ToeicMenuPage />} />
            <Route path="/trial" element={<TrialHomePage />} />
            <Route path="/updates/ai-scoring" element={<AiScoringPage />} />
            <Route path="/updates/introduce" element={<IntroducePage />} />
            <Route path="/updates/redesign" element={<RedesignPage />} />
            <Route
              path="/trial/:trialId"
              element={<TrialRunPage pages={trialPages} />}
            />
            <Route
              path="/trial/:trialId/report"
              element={<TrialReportPage />}
            />

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
                <Route
                  path={`${r.basePath}/:questionId`}
                  element={<KeyedByQuestion>{r.page}</KeyedByQuestion>}
                />
                <Route
                  path={`${RECALL_PATH}${r.taskId}/:questionId`}
                  element={
                    <KeyedByQuestion>
                      <RecallFrame>{r.page}</RecallFrame>
                    </KeyedByQuestion>
                  }
                />
              </Route>
            ))}
          </Routes>
        </Suspense>
      </AppShell>
    </HashRouter>
  );
}
