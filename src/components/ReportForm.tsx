import { useState, type FormEvent } from "react";
import type { Achievement, Distribution, Submission } from "../../shared/types";
import { formatRate, parseRate } from "../../shared/rate";
import { api } from "../api";
import { appendScreenshot, ScreenshotInput } from "./Screenshot";
import { RateInput } from "./SubmissionForm";
import { Turnstile } from "./Turnstile";
import { Icon } from "./Icons";

export function ReportForm({
  achievement,
  distribution,
  submission,
  siteKey,
  close,
}: {
  achievement: Achievement;
  distribution: Distribution[];
  submission: Submission | null;
  siteKey: string;
  close: () => void;
}) {
  const [wrongRates, setWrongRates] = useState<number[]>(
    submission ? [submission.rate] : [],
  );
  const [correctRate, setCorrectRate] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [verification, setVerification] = useState(0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!wrongRates.length || !file) {
      setError("请选择错误值并上传截图");
      return;
    }
    setBusy(true);
    try {
      const correct = parseRate(correctRate);
      if (wrongRates.includes(correct))
        throw new Error("正确值不能与错误值相同");
      const form = new FormData();
      form.set("achievementId", String(achievement.id));
      if (submission) form.set("submissionId", String(submission.id));
      wrongRates.forEach((rate) => form.append("wrongRate", formatRate(rate)));
      form.set("correctRate", correctRate);
      form.set("note", note);
      form.set("token", token);
      await appendScreenshot(form, file);
      await api.report(form);
      setDone(true);
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
        <h2>反馈已提交</h2>
        <p>等待管理员审核</p>
        <button className="button" onClick={close}>
          完成
        </button>
      </div>
    );
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="selected-achievement">
        <strong>{achievement.name}</strong>
        {submission && <small>记录 #{submission.id}</small>}
      </div>
      <div className="field">
        <div className="field-label label-row">
          <span>{submission ? "错误值" : "选择所有错误值"}</span>
          {!submission && (
            <button
              className="text-button"
              type="button"
              onClick={() =>
                setWrongRates(
                  wrongRates.length === distribution.length
                    ? []
                    : distribution.map((item) => item.rate),
                )
              }
            >
              {wrongRates.length === distribution.length ? "取消全选" : "全选"}
            </button>
          )}
        </div>
        {submission ? (
          <div className="reported-rate">{formatRate(submission.rate)}%</div>
        ) : (
          <div className="rate-options">
            {distribution.map((item) => (
              <label key={item.rate}>
                <input
                  type="checkbox"
                  checked={wrongRates.includes(item.rate)}
                  onChange={(event) =>
                    setWrongRates(
                      event.target.checked
                        ? [...wrongRates, item.rate]
                        : wrongRates.filter((rate) => rate !== item.rate),
                    )
                  }
                />
                <span>{formatRate(item.rate)}%</span>
                <small>{item.count} 条</small>
              </label>
            ))}
          </div>
        )}
      </div>
      <RateInput
        id="correct-rate"
        label="正确值"
        value={correctRate}
        setValue={setCorrectRate}
      />
      <ScreenshotInput file={file} setFile={setFile} />
      <div className="field">
        <label className="field-label" htmlFor="report-note">
          情况说明（选填）
        </label>
        <textarea
          className="input note-input"
          id="report-note"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      <Turnstile
        key={verification}
        siteKey={siteKey}
        action="report"
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
        disabled={busy || !token || !file || !wrongRates.length}
      >
        {busy ? "提交中…" : "提交反馈"}
      </button>
    </form>
  );
}
