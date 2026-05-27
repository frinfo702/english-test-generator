import { ListeningTaskBase } from "../../../components/question/ListeningTaskBase";

export function ConversationPage() {
  return (
    <ListeningTaskBase
      taskId="toefl/listening/conversation"
      title="Listen to a Conversation"
      subtitle="Listen to the audio and answer the questions."
      backTo="/toefl"
      showSpeedControl
    />
  );
}

export function LecturePage() {
  return (
    <ListeningTaskBase
      taskId="toefl/listening/lecture"
      title="Listen to a Lecture"
      subtitle="Listen to the audio and answer the questions."
      backTo="/toefl"
      showSpeedControl
    />
  );
}

export function AnnouncementPage() {
  return (
    <ListeningTaskBase
      taskId="toefl/listening/announcement"
      title="Listen to an Announcement"
      subtitle="Listen to the audio and answer the questions."
      backTo="/toefl"
      showSpeedControl
    />
  );
}
