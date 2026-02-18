import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import styles from "./HomePage.module.css";

export function HomePage() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>English Test Practice</h1>
        <p className={styles.description}>
          AIが毎回新しい問題を生成します。TOEFL 2026年新形式とTOEIC Readingに対応。
        </p>
      </div>

      <div className={styles.cards}>
        <div className={styles.card} onClick={() => navigate("/toefl")}>
          <div className={styles.cardBadge}>NEW FORMAT</div>
          <h2 className={styles.cardTitle}>TOEFL iBT 2026</h2>
          <p className={styles.cardDesc}>
            2026年1月新形式対応。Reading・Writing・Speaking（各セクション全タスク）
          </p>
          <ul className={styles.cardList}>
            <li>Reading: Complete the Words / Daily Life / Academic Passage</li>
            <li>Writing: Build a Sentence / Write an Email / Academic Discussion</li>
            <li>Speaking: Listen &amp; Repeat / Take an Interview</li>
          </ul>
          <Button className={styles.cardBtn}>練習を始める →</Button>
        </div>

        <div className={styles.card} onClick={() => navigate("/toeic")}>
          <h2 className={styles.cardTitle}>TOEIC Reading</h2>
          <p className={styles.cardDesc}>
            TOEIC L&amp;R テスト Readingセクション全パート対応
          </p>
          <ul className={styles.cardList}>
            <li>Part 5: Incomplete Sentences（30問）</li>
            <li>Part 6: Text Completion（16問）</li>
            <li>Part 7: Reading Comprehension（54問）</li>
          </ul>
          <Button className={styles.cardBtn}>練習を始める →</Button>
        </div>
      </div>

      <p className={styles.note}>
        ※ Anthropic APIキーが必要です。<code>.env.local</code> に{" "}
        <code>VITE_ANTHROPIC_API_KEY</code> を設定してください。
      </p>
    </div>
  );
}
