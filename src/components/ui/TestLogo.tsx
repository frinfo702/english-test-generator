import toefl from "../../assets/brand/toefl.svg";
import toeic from "../../assets/brand/toeic.svg";
import styles from "./TestLogo.module.css";

const LOGOS = { TOEFL: toefl, TOEIC: toeic };

/** Official one-colour wordmark, painted in the current ink via a mask so it
 *  stays legible on paper and carbon without touching the artwork. */
export function TestLogo({ name }: { name: keyof typeof LOGOS }) {
  const url = `url("${LOGOS[name]}")`;
  return (
    <span
      role="img"
      aria-label={name}
      className={`${styles.logo} ${styles[name]}`}
      style={{ maskImage: url, WebkitMaskImage: url }}
    />
  );
}
