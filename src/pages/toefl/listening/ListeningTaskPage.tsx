import {
  ListeningTaskBase,
  type ListeningProblemData,
} from "../../../components/question/ListeningTaskBase";

/** "Listen to a conversation between a professor and a student." */
function conversationPrompt({ audioSegments }: ListeningProblemData): string {
  const roles = [
    ...new Set(
      audioSegments.map((s) => s.role).filter((r) => r !== "Narrator"),
    ),
  ];
  if (roles.length !== 2) return "Listen to a conversation.";
  const [a, b] = roles.map((r) => {
    const noun = r.toLowerCase();
    return `${/^[aeiou]/.test(noun) ? "an" : "a"} ${noun}`;
  });
  return `Listen to a conversation between ${a} and ${b}.`;
}

export function ConversationPage() {
  return (
    <ListeningTaskBase
      taskId="toefl/listening/conversation"
      layout="talk"
      listenPrompt={conversationPrompt}
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
      layout="talk"
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
      layout="talk"
      listenPrompt={() => "Listen to an announcement."}
      title="Listen to an Announcement"
      subtitle="Listen to the audio and answer the questions."
      backTo="/toefl"
      showSpeedControl
    />
  );
}
