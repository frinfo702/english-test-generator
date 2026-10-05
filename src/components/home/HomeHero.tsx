import styles from "./HomeHero.module.css";

// Photos: public domain / CC0 via Wikimedia Commons — see public/images/hero/CREDITS.md
export function HomeHero() {
  return (
    <header className={styles.hero}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>TOEFL iBT 2026 · TOEIC L&amp;R</p>
        <h1 className={styles.title}>English Test Practice</h1>
        <p className={styles.lead}>
          Fresh questions every session. Read, write, listen and speak — a
          little bit every day.
        </p>
      </div>
      <div className={styles.art}>
        <img
          className={`${styles.photo} ${styles.photoBack}`}
          src="/images/hero/hall.jpg"
          alt=""
          width={320}
          height={480}
          loading="lazy"
        />
        <img
          className={`${styles.photo} ${styles.photoFront}`}
          src="/images/hero/tower.jpg"
          alt=""
          width={320}
          height={480}
          loading="lazy"
        />
      </div>
    </header>
  );
}
