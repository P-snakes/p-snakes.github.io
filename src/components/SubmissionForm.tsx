import { useState, type FormEvent } from "react";
import type { Achievement } from "../../shared/types";
import { parseRate } from "../../shared/rate";
import { api } from "../api";
import { AchievementPicker } from "./AchievementPicker";
import { appendScreenshot, ScreenshotInput } from "./Screenshot";
import { Turnstile } from "./Turnstile";
import { Icon } from "./Icons";

export function SubmissionForm({
  achievements,
  initial = null,
  siteKey,
  eventName,
  onSuccess,
}: {
  achievements: Achievement[];
  initial?: Achievement | null;
  siteKey: string;
  eventName: string;
  onSuccess: () => void;
}) {
  const [selected, setSelected] = useState<Achievement | null>(initial);
  const [rate, setRate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [verification, setVerification] = useState(0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!selected || !file) {
      setError("请选择成就并上传截图");
      return;
    }
    setBusy(true);
    try {
      parseRate(rate);
      const form = new FormData();
      form.set("achievementId", String(selected.id));
      form.set("rate", rate);
      form.set("token", token);
      await appendScreenshot(form, file);
      await api.submit(form);
      setDone(true);
      onSuccess();
    } catch (error) {
      setError((error as Error).message);
      setToken("");
      setVerification((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="success-panel">
        <span className="success-icon">
          <Icon name="check" size={26} />
        </span>
        <h2>已提交</h2>
        <p>记录将在快照更新后显示</p>
        <button
          className="button"
          onClick={() => {
            setDone(false);
            setRate("");
            setFile(null);
            setToken("");
            setVerification((value) => value + 1);
          }}
        >
          继续提交
        </button>
      </div>
    );
  return (
    <form onSubmit={submit} className="form-stack">
      <p className="form-source">{eventName}</p>
      <AchievementPicker
        achievements={achievements}
        selected={selected}
        choose={setSelected}
      />
      <RateInput
        id="submission-rate"
        label="显示的达成率"
        value={rate}
        setValue={setRate}
      />
      <ScreenshotInput file={file} setFile={setFile} />
      <Turnstile
        key={verification}
        siteKey={siteKey}
        action="submit"
        onToken={setToken}
        onError={setError}
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button primary full"
        disabled={busy || !token || !selected || !file}
      >
        {busy ? "提交中…" : "提交达成率"}
      </button>
    </form>
  );
}

export function RateInput({
  id,
  label,
  value,
  setValue,
}: {
  id: string;
  label: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="rate-input">
        <input
          id={id}
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
          maxLength={10}
          autoComplete="off"
        />
        <span>%</span>
      </div>
    </div>
  );
}
