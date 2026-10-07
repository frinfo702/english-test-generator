interface SpeakerFigureProps {
  /** Photo id under public/images/speakers/ (e.g. "f1", "m3"). */
  speaker?: string;
  /** People in the drawn fallback (2 for a conversation). */
  count?: number;
  className?: string;
}

/**
 * Full-length photo of the speaker in listening tasks; falls back to a
 * flat drawn lecturer when the question names no photo. Decorative only.
 */
export function SpeakerFigure({
  speaker,
  count = 1,
  className,
}: SpeakerFigureProps) {
  if (speaker) {
    return (
      <img
        className={className}
        src={`/images/speakers/${speaker}.jpg`}
        alt=""
        width={560}
        height={560}
        decoding="async"
      />
    );
  }
  // Same square box as a photo, figures standing on its bottom edge.
  return (
    <span
      className={className}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        aspectRatio: "1 / 1",
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <DrawnLecturer key={i} />
      ))}
    </span>
  );
}

function DrawnLecturer() {
  return (
    <svg
      style={{ height: "100%", width: "auto" }}
      viewBox="0 0 120 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="60" cy="251" rx="34" ry="4" fill="rgba(28, 25, 23, 0.12)" />
      {/* trousers */}
      <path d="M42 136 H60 L58 242 H46 Z" fill="#c8b79a" />
      <path d="M60 136 H78 L74 242 H62 Z" fill="#bfae90" />
      {/* shoes */}
      <rect x="37" y="239" width="22" height="8" rx="3.5" fill="#6b4a33" />
      <rect x="61" y="239" width="22" height="8" rx="3.5" fill="#6b4a33" />
      {/* jacket body */}
      <path d="M35 64 Q60 55 85 64 L89 140 L31 140 Z" fill="#2f3d57" />
      {/* shirt and tie */}
      <path d="M51 61 L60 96 L69 61 Z" fill="#5f8ac0" />
      <path d="M57.5 64 H62.5 L64.5 100 L60 107 L55.5 100 Z" fill="#6b5a48" />
      {/* lapels */}
      <path d="M51 61 L60 96 L47 72 Z" fill="#26324a" />
      <path d="M69 61 L60 96 L73 72 Z" fill="#26324a" />
      {/* sleeves, hands in pockets */}
      <path d="M35 65 Q25 100 32 130 L42 130 Q38 100 45 72 Z" fill="#2a374f" />
      <path d="M85 65 Q95 100 88 130 L78 130 Q82 100 75 72 Z" fill="#2a374f" />
      {/* neck and head */}
      <rect x="55" y="48" width="10" height="14" rx="3" fill="#b9876a" />
      <ellipse cx="60" cy="36" rx="13" ry="16" fill="#c9987a" />
      <path
        d="M46.5 37 Q45 17 60 17 Q75 17 73.5 37 Q71 25 60 25 Q49 25 46.5 37 Z"
        fill="#3b3330"
      />
    </svg>
  );
}
