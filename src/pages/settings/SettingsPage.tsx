import { useRef, useState, type ChangeEvent } from "react";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { PixelIcon } from "../../components/pixel/PixelIcon";
import { Button } from "../../components/ui/Button";
import { MakerLogo } from "../../components/ui/MakerLogo";
import { PoweredByGateway } from "../../components/ui/VercelMark";
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
import { exportBackup, importBackup } from "../../lib/attempts";
import dialogStyles from "../../components/layout/LegacyHistoryNotice.module.css";
import styles from "./SettingsPage.module.css";

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

const MAKER_NAMES = { anthropic: "Anthropic", openai: "OpenAI" };

const usd = (n: number) => `$${n.toFixed(2)}`;

/** One labelled setting: the label hangs left, the control sits right. */
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <h3 className={styles.rowLabel}>{label}</h3>
      <div className={styles.rowBody}>{children}</div>
    </div>
  );
}

function AiScoringSection() {
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

  const chooseMode = (mode: ScoringMode) => {
    saveScoringMode(mode);
    refresh();
  };

  const chooseModel = (model: string) => {
    saveGatewayModel(model);
    refresh();
  };

  const auto = settings.mode === "auto" && !!settings.key;

  return (
    <section
      id="ai-scoring"
      className={styles.section}
      aria-labelledby="ai-title"
    >
      <header className={styles.sectionHead}>
        <h2 id="ai-title" className={styles.sectionTitle}>
          AI scoring
        </h2>
        <PoweredByGateway prefix="" />
      </header>
      <p className={styles.lede}>
        Score Writing and Speaking right on the page with your own Vercel AI
        Gateway key, with no copy &amp; paste. You pay the gateway for what you
        use, usually well under a cent per answer.
      </p>

      <Row label="Scoring">
        <div className={styles.choices} role="radiogroup" aria-label="Scoring">
          <label
            className={[
              styles.choice,
              !settings.key ? styles.disabled : "",
            ].join(" ")}
          >
            <input
              type="radio"
              name="mode"
              checked={auto}
              disabled={!settings.key}
              onChange={() => chooseMode("auto")}
            />
            Automatic, with my key
          </label>
          <label className={styles.choice}>
            <input
              type="radio"
              name="mode"
              checked={!auto}
              onChange={() => chooseMode("manual")}
            />
            Copy &amp; paste into any AI chat
          </label>
        </div>
        {!settings.key && (
          <p className={styles.hint}>Automatic scoring needs a saved key.</p>
        )}
      </Row>

      <Row label="AI Gateway key">
        {settings.key ? (
          <div className={styles.saved}>
            <span className={styles.savedKey}>{maskKey(settings.key)}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void verify(settings.key!)}
              disabled={check.state === "checking"}
            >
              Check
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                clearGatewayKey();
                setCheck({ state: "idle" });
                refresh();
              }}
            >
              Remove
            </Button>
          </div>
        ) : (
          <form
            className={styles.inline}
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <div className={styles.keyField}>
              <label className={styles.fill}>
                <span className="sr-only">AI Gateway API key</span>
                <input
                  type={reveal ? "text" : "password"}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Paste your key"
                  autoComplete="off"
                  spellCheck={false}
                  className={styles.input}
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
              size="sm"
              type="submit"
              disabled={!draft.trim() || check.state === "checking"}
            >
              Save
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
        <p className={styles.hint}>
          Kept only in this browser and sent only to ai-gateway.vercel.sh, never
          to our servers. Remove it on a shared computer.{" "}
          <a href={CREATE_KEY_URL} target="_blank" rel="noreferrer">
            Create a key ↗
          </a>
        </p>
      </Row>

      <Row label="Model">
        <div
          className={styles.models}
          role="radiogroup"
          aria-label="Recommended models"
        >
          {RECOMMENDED_MODELS.map((m) => (
            <label key={m.id} className={styles.model}>
              <input
                type="radio"
                name="model"
                checked={settings.model === m.id}
                onChange={() => chooseModel(m.id)}
              />
              <MakerLogo maker={m.maker} />
              <span className={styles.modelText}>
                <span className={styles.modelName}>
                  {m.name}
                  <span className={styles.tag}>
                    {m.id === DEFAULT_MODEL
                      ? "Recommended · default"
                      : "Recommended"}
                  </span>
                </span>
                <span className={styles.hint}>{m.pitch}</span>
              </span>
              <span className={styles.modelMeta}>
                <span>{MAKER_NAMES[m.maker]}</span>
                <span>
                  {usd(m.price[0])} / {usd(m.price[1])} per 1M
                </span>
              </span>
            </label>
          ))}
        </div>
        <form
          className={styles.inline}
          onSubmit={(e) => {
            e.preventDefault();
            if (custom.trim()) chooseModel(custom);
          }}
        >
          <label className={styles.fill}>
            <span className="sr-only">Another AI Gateway model ID</span>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Another model, e.g. openai/gpt-5.6-luna"
              spellCheck={false}
              className={[
                styles.input,
                !recommended ? styles.inputActive : "",
              ].join(" ")}
            />
          </label>
          <Button
            size="sm"
            variant="secondary"
            type="submit"
            disabled={!custom.trim() || custom.trim() === settings.model}
          >
            Use
          </Button>
        </form>
        <p className={styles.hint}>
          Prices are input / output per million tokens, AI Gateway list prices
          as of October 2026.{" "}
          <a href={MODELS_URL} target="_blank" rel="noreferrer">
            All models ↗
          </a>
        </p>
      </Row>
    </section>
  );
}

function DataSection() {
  const [includeAudio, setIncludeAudio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const exportDialogRef = useRef<HTMLDialogElement>(null);

  const handleExport = async () => {
    exportDialogRef.current?.close();
    setBusy(true);
    setMessage(null);
    try {
      const url = URL.createObjectURL(await exportBackup(includeAudio));
      const link = document.createElement("a");
      link.href = url;
      link.download = `english-test-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      setMessage(`Export failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const count = await importBackup(file);
      setMessage(`Imported ${count} attempt${count === 1 ? "" : "s"}.`);
    } catch (err) {
      setMessage(`Import failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="data" className={styles.section} aria-labelledby="data-title">
      <header className={styles.sectionHead}>
        <h2 id="data-title" className={styles.sectionTitle}>
          Data
        </h2>
      </header>
      <Row label="Backup">
        <p className={styles.hint}>
          Your history lives only in this browser. Export it to keep a copy or
          to move to another browser. Importing adds to what is here, so
          importing the same file twice is harmless.
        </p>
        <div className={styles.backupActions}>
          <Button
            variant="secondary"
            size="sm"
            className={styles.backupBtn}
            onClick={() => exportDialogRef.current?.showModal()}
            disabled={busy}
          >
            <PixelIcon
              name="exportTray"
              className={`${styles.backupIcon} ${styles.exportIcon}`}
            />
            Export
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className={styles.backupBtn}
            onClick={() => importInputRef.current?.click()}
            disabled={busy}
          >
            <PixelIcon
              name="importTray"
              className={`${styles.backupIcon} ${styles.importIcon}`}
            />
            Import
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImport}
          />
        </div>
        {message && (
          <p className={styles.hint} role="status">
            {message}
          </p>
        )}
      </Row>
      <dialog
        ref={exportDialogRef}
        className={dialogStyles.dialog}
        aria-labelledby="export-dialog-title"
      >
        <h2 id="export-dialog-title" className={dialogStyles.title}>
          Export backup
        </h2>
        <label className={`${styles.backupOption} ${dialogStyles.body}`}>
          <input
            type="checkbox"
            checked={includeAudio}
            onChange={(e) => setIncludeAudio(e.target.checked)}
          />
          Include speaking recordings (makes the file much larger)
        </label>
        <div className={dialogStyles.actions}>
          <Button size="sm" onClick={handleExport}>
            Export
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => exportDialogRef.current?.close()}
          >
            Cancel
          </Button>
        </div>
      </dialog>
    </section>
  );
}

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <SectionHeader
        title="Settings"
        subtitle="Everything here stays in this browser."
        backTo="/"
      />
      <AiScoringSection />
      <DataSection />
      <p className={styles.legal}>
        Vercel, the Vercel logo and AI Gateway are trademarks of Vercel, Inc.
        Anthropic, Claude and the Anthropic logo are trademarks of Anthropic,
        PBC. OpenAI, ChatGPT, GPT and the OpenAI logo are trademarks of OpenAI.
        Logos identify each maker&rsquo;s models only and imply no endorsement.
      </p>
    </div>
  );
}
