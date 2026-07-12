import { useState } from "react";
import {
  getInterviewerDisplayName,
  getInterviewerPortraitUrl,
} from "../../../lib/voiceMapping";
import styles from "./TakeInterviewPage.module.css";

interface InterviewerCardProps {
  voiceId: string;
  speaking?: boolean;
}

export function InterviewerCard({
  voiceId,
  speaking = false,
}: InterviewerCardProps) {
  const [portraitFailed, setPortraitFailed] = useState(false);
  const name = getInterviewerDisplayName(voiceId);
  const portraitUrl = getInterviewerPortraitUrl(voiceId);

  return (
    <div className={styles.interviewer}>
      <div className={styles.avatarWrap}>
        {!portraitFailed ? (
          <img
            src={portraitUrl}
            alt={`Interviewer ${name}`}
            className={styles.avatar}
            onError={() => setPortraitFailed(true)}
          />
        ) : (
          <div className={styles.avatarFallback} aria-hidden="true">
            {name.slice(0, 1)}
          </div>
        )}
        {speaking && (
          <span className={styles.speakingRing} aria-hidden="true" />
        )}
      </div>
      <div className={styles.interviewerMeta}>
        <p className={styles.interviewerName}>{name}</p>
        <p className={styles.interviewerRole}>Interviewer</p>
        <p className={styles.interviewerHint}>Voice: {voiceId}</p>
      </div>
    </div>
  );
}
