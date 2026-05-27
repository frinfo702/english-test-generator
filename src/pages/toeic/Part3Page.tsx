import { ListeningTaskBase } from "../../components/question/ListeningTaskBase";

export function Part3Page() {
  return (
    <ListeningTaskBase
      taskId="toeic/part3"
      title="Part 3: Conversations"
      subtitle="Listen to the conversation and answer the questions."
      backTo="/toeic"
      readQuestionsAloud
    />
  );
}
