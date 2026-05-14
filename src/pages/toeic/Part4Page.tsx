import { ToeicListeningTaskPageBase } from "./ToeicListeningTaskPage";

export function Part4Page() {
  return (
    <ToeicListeningTaskPageBase
      taskId="toeic/part4"
      subtitle="Listen to the talk and answer the questions."
      partLabel="Part 4: Talks"
      readQuestionsAloud
    />
  );
}
