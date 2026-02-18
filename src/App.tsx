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
import { Part5Page } from "./pages/toeic/Part5Page";
import { Part6Page } from "./pages/toeic/Part6Page";
import { Part7Page } from "./pages/toeic/Part7Page";

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* TOEFL */}
          <Route path="/toefl" element={<ToeflMenuPage />} />
          <Route
            path="/toefl/reading/complete-words"
            element={<CompleteWordsPage />}
          />
          <Route
            path="/toefl/reading/daily-life"
            element={<ReadDailyLifePage />}
          />
          <Route
            path="/toefl/reading/academic"
            element={<ReadAcademicPage />}
          />
          <Route
            path="/toefl/writing/build-sentence"
            element={<BuildSentencePage />}
          />
          <Route path="/toefl/writing/email" element={<WriteEmailPage />} />
          <Route
            path="/toefl/writing/discussion"
            element={<WriteDiscussionPage />}
          />
          <Route
            path="/toefl/speaking/listen-repeat"
            element={<ListenRepeatPage />}
          />
          <Route
            path="/toefl/speaking/interview"
            element={<TakeInterviewPage />}
          />

          {/* TOEIC */}
          <Route path="/toeic" element={<ToeicMenuPage />} />
          <Route path="/toeic/part5" element={<Part5Page />} />
          <Route path="/toeic/part6" element={<Part6Page />} />
          <Route path="/toeic/part7" element={<Part7Page />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
