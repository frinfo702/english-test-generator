import type { ReactNode } from "react";
import {
  parseEmail,
  parseNotice,
  readingPrompt,
  resolveLayout,
  type ChatMessage,
  type DailyLifeText,
  type NoticeIcon,
} from "./dailyLife";
import styles from "./DailyLifeTextView.module.css";

const SENDER_TONES = 4;

function senderOrder(messages: ChatMessage[]): Map<string, number> {
  const order = new Map<string, number>();
  for (const m of messages) {
    if (!order.has(m.sender)) order.set(m.sender, order.size);
  }
  return order;
}

function MessageHeading({ message }: { message: ChatMessage }) {
  return (
    <div className={styles.msgHeading}>
      <span className={styles.sender}>{message.sender}</span>
      {message.time && <span className={styles.time}>({message.time})</span>}
    </div>
  );
}

function EmailView({ content }: { content: string }) {
  const { headers, body } = parseEmail(content);
  return (
    <div className={styles.email}>
      {headers.length > 0 && (
        <div className={styles.emailHeader}>
          {headers.map((h) => (
            <div key={h.label} className={styles.emailField}>
              <strong>{h.label}:</strong> {h.value}
            </div>
          ))}
        </div>
      )}
      <div className={styles.emailBody}>{body}</div>
    </div>
  );
}

function ChatView({ messages }: { messages: ChatMessage[] }) {
  const self = messages[0]?.sender;
  return (
    <div className={styles.phone}>
      <div className={styles.phoneScreen}>
        <div className={styles.notch} aria-hidden="true">
          <span className={styles.speaker} />
          <span className={styles.camera} />
        </div>
        <ol className={styles.bubbles}>
          {messages.map((m, i) => (
            <li
              key={i}
              className={[
                styles.bubble,
                m.sender === self ? styles.bubbleSelf : styles.bubbleOther,
              ].join(" ")}
            >
              <MessageHeading message={m} />
              <p className={styles.msgText}>{m.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function LiveChatView({
  title,
  messages,
}: {
  title: string;
  messages: ChatMessage[];
}) {
  const order = senderOrder(messages);
  return (
    <div className={styles.liveChat}>
      <div className={styles.liveHeader}>
        <div className={styles.liveTitle}>{title}</div>
      </div>
      <ol className={styles.liveRows}>
        {messages.map((m, i) => (
          <li
            key={i}
            className={styles.liveRow}
            data-tone={(order.get(m.sender) ?? 0) % SENDER_TONES}
          >
            <MessageHeading message={m} />
            <p className={styles.msgText}>{m.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

const ICON_PATHS: Record<NoticeIcon, ReactNode> = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18M4.5 7.5h15M4.5 16.5h15" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4h3l8 4V6L7 10H4z" />
      <path d="M7 14l1.5 5h2.5l-1.2-4.4" />
      <path d="M18 9.5a3 3 0 0 1 0 5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9-8-8z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
};

function NoticeView({ text }: { text: DailyLifeText }) {
  const { title, paragraphs, centered } = parseNotice(text);
  const icon = text.icon ? ICON_PATHS[text.icon] : null;
  return (
    <div className={styles.notice}>
      {(icon || title) && (
        <div className={styles.noticeHead}>
          {icon && (
            <svg
              className={styles.noticeIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {icon}
            </svg>
          )}
          {title && <h3 className={styles.noticeTitle}>{title}</h3>}
        </div>
      )}
      <div
        className={[
          styles.noticeBody,
          centered ? styles.noticeCentered : "",
        ].join(" ")}
      >
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

function DocumentView({ text }: { text: DailyLifeText }) {
  return (
    <div className={styles.document}>
      <div className={styles.docType}>{text.textType}</div>
      <div className={styles.docContent}>{text.content}</div>
    </div>
  );
}

export function DailyLifeTextView({ text }: { text: DailyLifeText }) {
  const layout = resolveLayout(text);
  return (
    <div className={styles.frame}>
      <p className={styles.prompt}>{readingPrompt(text)}</p>
      {layout === "email" && <EmailView content={text.content ?? ""} />}
      {layout === "chat" && <ChatView messages={text.messages ?? []} />}
      {layout === "live-chat" && (
        <LiveChatView
          title={text.title ?? "Live Chat"}
          messages={text.messages ?? []}
        />
      )}
      {layout === "notice" && <NoticeView text={text} />}
      {layout === "document" && <DocumentView text={text} />}
    </div>
  );
}
