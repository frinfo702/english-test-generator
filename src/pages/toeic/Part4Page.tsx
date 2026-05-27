import { ListeningTaskBase } from "../../components/question/ListeningTaskBase";

export function Part4Page() {
  return (
    <ListeningTaskBase
      taskId="toeic/part4"
      title="Part 4: Talks"
      subtitle="Listen to the talk and answer the questions."
      backTo="/toeic"
      readQuestionsAloud
    />
  );
}
