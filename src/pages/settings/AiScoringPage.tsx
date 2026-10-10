import { useState } from "react";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { ThinkingOrb } from "../../components/ui/ThinkingOrb";
import { VercelMark } from "../../components/ui/VercelMark";
import {
  checkGatewayKey,
  clearGatewayKey,
  DEFAULT_MODEL,
  GatewayError,
  loadScoringSettings,
  RECOMMENDED_MODELS,
  saveGatewayKey,
  saveGatewayModel,
  saveScoringMode,
  type ScoringMode,
} from "../../lib/aiGateway";
import styles from "./AiScoringPage.module.css";

// The page Vercel's own "authentication failed" error links to.
const CREATE_KEY_URL =
  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai-gateway%2Fapi-keys%3FshowCreateKeyModal";
const MODELS_URL = "https://vercel.com/ai-gateway/models";

type Check =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok"; balance: number | null }
  | { state: "error"; message: string };

function maskKey(key: string) {
  return key.length > 10 ? `${key.slice(0, 4)}…${key.slice(-4)}` : "••••";
}

const usd = (n: number) => `$${n.toFixed(2)}`;

export function AiScoringPage() {
  const [settings, setSettings] = useState(loadScoringSettings);
  const [draft, setDraft] = useState("");
  const [reveal, setReveal] = useState(false);
  const [check, setCheck] = useState<Check>({ state: "idle" });
  const recommended = RECOMMENDED_MODELS.some((m) => m.id === settings.model);
  const [custom, setCustom] = useState(recommended ? "" : settings.model);

  const refresh = () => setSettings(loadScoringSettings());

  const verify = async (key: string) => {
    setCheck({ state: "checking" });
    try {
      setCheck({ state: "ok", balance: await checkGatewayKey(key) });
      return true;
    } catch (e) {
      setCheck({
        state: "error",
        message: e instanceof Error ? e.message : String(e),
      });
      return !(e instanceof GatewayError && e.kind === "auth");
    }
  };

  const handleSave = async () => {
    const key = draft.trim();
    if (!key) return;
    // A rejected key is never stored; an unreachable gateway is not the key's fault.
    if (!(await verify(key))) return;
    saveGatewayKey(key);
    setDraft("");
    setReveal(false);
    refresh();
  };

  const handleRemove = () => {
    clearGatewayKey();
    setCheck({ state: "idle" });
    refresh();
  };

  const chooseMode = (mode: ScoringMode) => {
    saveScoringMode(mode);
    refresh();
  };

  const chooseModel = (model: string) => {
    saveGatewayModel(model);
    refresh();
  };

  return (
    <div className={styles.page}>
      <SectionHeader
        title="AI scoring"
        subtitle="Score Writing and Speaking on the page, with your own key."
        backTo="/"
      />

      <section className={styles.hero} aria-labelledby="byok-title">
        <div className={styles.heroText}>
          <p className="micro-label">Bring your own key</p>
          <h2 id="byok-title" className={styles.heroTitle}>
            You pay for what you use.
            <br />
            Your score lands right here.
          </h2>
          <p className={styles.lede}>
            Add a Vercel AI Gateway key and every Writing and Speaking answer is
            scored the moment you finish: no copying a prompt into a chat, no
            pasting the reply back. Usage is billed to your own AI Gateway
            account, usually a fraction of a cent per answer.
          </p>
        </div>
        <div className={styles.gateway} aria-hidden="true">
          <VercelMark size={44} />
          <span className={styles.gatewayName}>AI Gateway</span>
          <span className={styles.gatewayBy}>Powered by Vercel</span>
        </div>
        <ol className={styles.flow}>
          <li>
            <span className={styles.step}>01</span>
            <span>Finish a Writing or Speaking task.</span>
          </li>
          <li>
            <span className={styles.step}>02</span>
            <span>
              Pronunciation, pace and other scores the app measures show at
              once.
            </span>
          </li>
          <li>
            <span className={styles.step}>03</span>
            <span className={styles.flowLive}>
              <ThinkingOrb />
              The AI&rsquo;s rubric score and feedback fill in seconds later.
            </span>
          </li>
        </ol>
      </section>

      <section className={styles.block} aria-labelledby="mode-title">
        <div className={styles.blockHead}>
          <h2 id="mode-title" className="micro-label">
            Scoring
          </h2>
        </div>
        <div
          className={styles.rows}
          role="radiogroup"
          aria-labelledby="mode-title"
        >
          <label
            className={[
              styles.row,
              !settings.key ? styles.rowDisabled : "",
            ].join(" ")}
          >
            <input
              type="radio"
              name="mode"
              checked={settings.mode === "auto" && !!settings.key}
              disabled={!settings.key}
              onChange={() => chooseMode("auto")}
            />
            <span className={styles.rowText}>
              <span className={styles.rowTitle}>
                Score automatically with my key
              </span>
              <span className={styles.rowMeta}>
                {settings.key
                  ? "Scoring starts as soon as you finish."
                  : "Save an AI Gateway key below to turn this on."}
              </span>
            </span>
          </label>
          <label className={styles.row}>
            <input
              type="radio"
              name="mode"
              checked={settings.mode !== "auto" || !settings.key}
              onChange={() => chooseMode("manual")}
            />
            <span className={styles.rowText}>
              <span className={styles.rowTitle}>Copy &amp; paste</span>
              <span className={styles.rowMeta}>
                Copy a prompt into any AI chat and paste its reply back. Free
                with the chat you already use.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="key-title">
        <div className={styles.blockHead}>
          <h2 id="key-title" className="micro-label">
            AI Gateway key
          </h2>
          <a
            className={styles.external}
            href={CREATE_KEY_URL}
            target="_blank"
            rel="noreferrer"
          >
            Create a key on Vercel ↗
          </a>
        </div>
        {settings.key ? (
          <div className={styles.saved}>
            <span className={styles.savedKey}>{maskKey(settings.key)}</span>
            <span className={styles.rowMeta}>Saved in this browser</span>
            <div className={styles.actions}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void verify(settings.key!)}
                disabled={check.state === "checking"}
              >
                Check key
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRemove}>
                Remove key
              </Button>
            </div>
          </div>
        ) : (
          <form
            className={styles.keyForm}
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <div className={styles.keyField}>
              <label className={styles.keyLabel}>
                <span className="sr-only">AI Gateway API key</span>
                <input
                  type={reveal ? "text" : "password"}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Paste your AI Gateway API key"
                  autoComplete="off"
                  spellCheck={false}
                  className={styles.keyInput}
                />
              </label>
              <button
                type="button"
                className={styles.reveal}
                onClick={() => setReveal((v) => !v)}
                aria-pressed={reveal}
                aria-label="Show key"
              >
                {reveal ? "Hide" : "Show"}
              </button>
            </div>
            <Button
              type="submit"
              disabled={!draft.trim() || check.state === "checking"}
            >
              Save key
            </Button>
          </form>
        )}
        <p className={styles.check} aria-live="polite">
          {check.state === "checking" && "Checking with AI Gateway…"}
          {check.state === "ok" &&
            (check.balance === null
              ? "Key works."
              : `Key works · ${usd(check.balance)} credit left.`)}
          {check.state === "error" && (
            <span className={styles.checkError}>{check.message}</span>
          )}
        </p>
        <ul className={styles.privacy}>
          <li>Your key is stored only in this browser.</li>
          <li>
            It goes straight from this page to ai-gateway.vercel.sh with each
            scoring request, and nowhere else: no account, no database, nothing
            kept on our servers.
          </li>
          <li>
            Anyone using this browser profile can use it. Remove it on a shared
            computer.
          </li>
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="model-title">
        <div className={styles.blockHead}>
          <h2 id="model-title" className="micro-label">
            Model
          </h2>
          <span className={styles.rowMeta}>
            We strongly recommend one of these three.
          </span>
        </div>
        <div
          className={styles.models}
          role="radiogroup"
          aria-labelledby="model-title"
        >
          {RECOMMENDED_MODELS.map((m) => (
            <label key={m.id} className={styles.model}>
              <input
                type="radio"
                name="model"
                checked={settings.model === m.id}
                onChange={() => chooseModel(m.id)}
              />
              <span className={styles.modelTop}>
                <span className={styles.modelMaker}>{m.maker}</span>
                <span className={styles.tag}>
                  {m.id === DEFAULT_MODEL
                    ? "Recommended · default"
                    : "Recommended"}
                </span>
              </span>
              <span className={styles.modelName}>{m.name}</span>
              <span className={styles.modelPitch}>{m.pitch}</span>
              <span className={styles.modelFoot}>
                <span className={styles.modelId}>{m.id}</span>
                <span className={styles.modelPrice}>
                  {usd(m.price[0])} in · {usd(m.price[1])} out / 1M tokens
                </span>
              </span>
            </label>
          ))}
        </div>
        <form
          className={styles.custom}
          onSubmit={(e) => {
            e.preventDefault();
            if (custom.trim()) chooseModel(custom);
          }}
        >
          <label className={styles.customField}>
            <span className={styles.rowTitle}>Another model</span>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="provider/model, e.g. openai/gpt-5.6-luna"
              spellCheck={false}
              className={[
                styles.keyInput,
                !recommended ? styles.customActive : "",
              ].join(" ")}
            />
          </label>
          <Button
            size="sm"
            variant="secondary"
            type="submit"
            disabled={!custom.trim() || custom.trim() === settings.model}
          >
            Use this model
          </Button>
          <a
            className={styles.external}
            href={MODELS_URL}
            target="_blank"
            rel="noreferrer"
          >
            All AI Gateway models ↗
          </a>
        </form>
      </section>

      <p className={styles.legal}>
        Vercel, the Vercel logo and AI Gateway are trademarks of Vercel, Inc.
        Model names belong to their makers. Prices are AI Gateway&rsquo;s list
        prices as of October 2026; your AI Gateway dashboard has the current
        ones.
      </p>
    </div>
  );
}
