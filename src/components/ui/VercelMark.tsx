import styles from "./VercelMark.module.css";

/**
 * The Vercel symbol, unmodified (vercel.com/geist/brands): black on light
 * surfaces, white on dark ones. Used only to say the feature runs on
 * Vercel AI Gateway.
 */
export function VercelMark({ size = 12 }: { size?: number }) {
  return (
    <svg
      className={styles.mark}
      width={size * 1.15}
      height={size}
      viewBox="0 0 115 100"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M57.5 0 115 100H0z" />
    </svg>
  );
}

/** "▲ Powered by Vercel AI Gateway" byline. */
export function PoweredByGateway({
  prefix = "Powered by",
}: {
  prefix?: string;
}) {
  return (
    <span className={styles.byline}>
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <VercelMark />
      <span className={styles.name}>Vercel AI Gateway</span>
    </span>
  );
}
