import type { TaskId } from "../../hooks/useScoreHistory";

export const TASK_NAMES: Partial<Record<TaskId, string>> = {
  "toefl/reading/complete-words": "Complete the Words",
  "toefl/reading/daily-life": "Read in Daily Life",
  "toefl/reading/academic": "Read an Academic Passage",
  "toefl/listening/response": "Listen and Choose a Response",
  "toefl/listening/conversation": "Listen to a Conversation",
  "toefl/listening/announcement": "Listen to an Announcement",
  "toefl/listening/lecture": "Listen to an Academic Talk",
  "toefl/writing/build-sentence": "Build a Sentence",
  "toefl/writing/email": "Write an Email",
  "toefl/writing/discussion": "Write for an Academic Discussion",
  "toefl/speaking/listen-repeat": "Listen and Repeat",
  "toefl/speaking/interview": "Take an Interview",
};
