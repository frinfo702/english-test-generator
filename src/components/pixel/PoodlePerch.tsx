import { useEffect, useRef, useState } from "react";
import { PixelPoodle } from "./PixelPoodle";
import styles from "./PoodlePerch.module.css";

interface PoodlePerchProps {
  children: React.ReactNode;
}

/**
 * Seats the pixel poodle on top of an input box. Typing inside the box
 * gets it excited for a moment.
 */
export function PoodlePerch({ children }: PoodlePerchProps) {
  const [excited, setExcited] = useState(false);
  const calmTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(calmTimer.current), []);

  const handleInput = () => {
    setExcited(true);
    window.clearTimeout(calmTimer.current);
    calmTimer.current = window.setTimeout(() => setExcited(false), 900);
  };

  return (
    <div className={styles.perch} onInput={handleInput}>
      <PixelPoodle className={styles.poodle} excited={excited} />
      {children}
    </div>
  );
}
