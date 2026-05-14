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
            element={
              <QuestionSelectorPage
                taskId="toefl/reading/complete-words"
                title="Complete the Words"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/reading/complete-words"
              />
            }
          />
          <Route
            path="/toefl/reading/complete-words/:questionNumber"
            element={<CompleteWordsPage />}
          />
          <Route
            path="/toefl/reading/daily-life"
            element={
              <QuestionSelectorPage
                taskId="toefl/reading/daily-life"
                title="Read in Daily Life"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/reading/daily-life"
              />
            }
          />
          <Route
            path="/toefl/reading/daily-life/:questionNumber"
            element={<ReadDailyLifePage />}
          />
          <Route
            path="/toefl/reading/academic"
            element={
              <QuestionSelectorPage
                taskId="toefl/reading/academic"
                title="Read an Academic Passage"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/reading/academic"
              />
            }
          />
          <Route
            path="/toefl/reading/academic/:questionNumber"
            element={<ReadAcademicPage />}
          />
          <Route
            path="/toefl/writing/build-sentence"
            element={
              <QuestionSelectorPage
                taskId="toefl/writing/build-sentence"
                title="Build a Sentence"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/writing/build-sentence"
              />
            }
          />
          <Route
            path="/toefl/writing/build-sentence/:questionNumber"
            element={<BuildSentencePage />}
          />
          <Route
            path="/toefl/writing/email"
            element={
              <QuestionSelectorPage
                taskId="toefl/writing/email"
                title="Write an Email"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/writing/email"
              />
            }
          />
          <Route
            path="/toefl/writing/email/:questionNumber"
            element={<WriteEmailPage />}
          />
          <Route
            path="/toefl/writing/discussion"
            element={
              <QuestionSelectorPage
                taskId="toefl/writing/discussion"
                title="Write for an Academic Discussion"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/writing/discussion"
              />
            }
          />
          <Route
            path="/toefl/writing/discussion/:questionNumber"
            element={<WriteDiscussionPage />}
          />
          <Route
            path="/toefl/speaking/listen-repeat"
            element={
              <QuestionSelectorPage
                taskId="toefl/speaking/listen-repeat"
                title="Listen and Repeat"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/speaking/listen-repeat"
              />
            }
          />
          <Route
            path="/toefl/speaking/listen-repeat/:questionNumber"
            element={<ListenRepeatPage />}
          />
          <Route
            path="/toefl/speaking/interview"
            element={
              <QuestionSelectorPage
                taskId="toefl/speaking/interview"
                title="Take an Interview"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/speaking/interview"
              />
            }
          />
          <Route
            path="/toefl/speaking/interview/:questionNumber"
            element={<TakeInterviewPage />}
          />

          {/* Listening */}
          <Route
            path="/toefl/listening/conversation"
            element={
              <QuestionSelectorPage
                taskId="toefl/listening/conversation"
                title="Listen to a Conversation"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/listening/conversation"
              />
            }
          />
          <Route
            path="/toefl/listening/conversation/:questionNumber"
            element={<ConversationPage />}
          />
          <Route
            path="/toefl/listening/lecture"
            element={
              <QuestionSelectorPage
                taskId="toefl/listening/lecture"
                title="Listen to a Lecture"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/listening/lecture"
              />
            }
          />
          <Route
            path="/toefl/listening/lecture/:questionNumber"
            element={<LecturePage />}
          />
          <Route
            path="/toefl/listening/response"
            element={
              <QuestionSelectorPage
                taskId="toefl/listening/response"
                title="Listen and Choose a Response"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/listening/response"
              />
            }
          />
          <Route
            path="/toefl/listening/response/:questionNumber"
            element={<ListenResponsePage />}
          />
          <Route
            path="/toefl/listening/announcement"
            element={
              <QuestionSelectorPage
                taskId="toefl/listening/announcement"
                title="Listen to an Announcement"
                subtitle="Select a question number or start with random."
                backTo="/toefl"
                basePath="/toefl/listening/announcement"
              />
            }
          />
          <Route
            path="/toefl/listening/announcement/:questionNumber"
            element={<AnnouncementPage />}
          />

          {/* TOEIC */}
          <Route path="/toeic" element={<ToeicMenuPage />} />
          <Route
            path="/toeic/part2"
            element={
              <QuestionSelectorPage
                taskId="toeic/part2"
                title="Part 2: Question-Response"
                subtitle="Select a question number or start with random."
                backTo="/toeic"
                basePath="/toeic/part2"
              />
            }
          />
          <Route path="/toeic/part2/:questionNumber" element={<Part2Page />} />
          <Route
            path="/toeic/part3"
            element={
              <QuestionSelectorPage
                taskId="toeic/part3"
                title="Part 3: Conversations"
                subtitle="Select a question number or start with random."
                backTo="/toeic"
                basePath="/toeic/part3"
              />
            }
          />
          <Route path="/toeic/part3/:questionNumber" element={<Part3Page />} />
          <Route
            path="/toeic/part4"
            element={
              <QuestionSelectorPage
                taskId="toeic/part4"
                title="Part 4: Talks"
                subtitle="Select a question number or start with random."
                backTo="/toeic"
                basePath="/toeic/part4"
              />
            }
          />
          <Route path="/toeic/part4/:questionNumber" element={<Part4Page />} />
          <Route
            path="/toeic/part5"
            element={
              <QuestionSelectorPage
                taskId="toeic/part5"
                title="Part 5: Incomplete Sentences"
                subtitle="Select a question number or start with random."
                backTo="/toeic"
                basePath="/toeic/part5"
              />
            }
          />
          <Route path="/toeic/part5/:questionNumber" element={<Part5Page />} />
          <Route
            path="/toeic/part6"
            element={
              <QuestionSelectorPage
                taskId="toeic/part6"
                title="Part 6: Text Completion"
                subtitle="Select a question number or start with random."
                backTo="/toeic"
                basePath="/toeic/part6"
              />
            }
          />
          <Route path="/toeic/part6/:questionNumber" element={<Part6Page />} />
          <Route
            path="/toeic/part7"
            element={
              <QuestionSelectorPage
                taskId="toeic/part7"
                title="Part 7: Reading Comprehension"
                subtitle="Select a question number or start with random."
                backTo="/toeic"
                basePath="/toeic/part7"
              />
            }
          />
          <Route path="/toeic/part7/:questionNumber" element={<Part7Page />} />

          {/* Shadowing */}
          <Route
            path="/shadowing"
            element={
              <QuestionSelectorPage
                taskId="shadowing"
                title="Shadowing Practice"
                subtitle="Select a shadowing set or start with a random one."
                backTo="/"
                basePath="/shadowing"
              />
            }
          />
          <Route
            path="/shadowing/:questionNumber"
            element={<ShadowingPage />}
          />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
