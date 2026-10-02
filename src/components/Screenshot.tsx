import { useEffect, useState } from "react";
import { api, evidenceUrl, type EvidenceAccess } from "../api";
import { Icon } from "./Icons";
import { Modal } from "./Modal";
import { Turnstile } from "./Turnstile";

export function EvidenceVerification({
  siteKey,
  variant,
  target,
  onVerified,
}: {
  siteKey: string;
  variant: "thumb" | "original";
  target: number | string;
  onVerified: (access: EvidenceAccess) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <>
      <Turnstile
        key={attempt}
        siteKey={siteKey}
        action={variant === "thumb" ? "thumbnails" : "original"}
        onToken={(token) => {
          if (!token) return;
          setBusy(true);
          api
            .evidenceAccess(variant, target, token)
            .then(onVerified)
            .catch((error) => setError(error.message))
            .finally(() => setBusy(false));
        }}
        onError={setError}
      />
      {busy && <p className="muted">验证中…</p>}
      {error && (
        <p className="error" role="alert">
          {error}{" "}
          <button
            className="text-button"
            onClick={() => {
              setError("");
              setAttempt((value) => value + 1);
            }}
          >
            重新验证
          </button>
        </p>
      )}
    </>
  );
}

export function Screenshot({
  id,
  siteKey,
  thumbnailAccess,
}: {
  id: string;
  siteKey: string;
  thumbnailAccess?: string;
}) {
  const [open, setOpen] = useState(false);
  const [originalAccess, setOriginalAccess] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <button
        className={thumbnailAccess ? "thumbnail" : "text-button proof-button"}
        aria-label="查看截图凭证"
        onClick={() => {
          setOriginalAccess("");
          setError("");
          setOpen(true);
        }}
      >
        {thumbnailAccess ? (
          <img
            src={evidenceUrl(id, "thumb", thumbnailAccess)}
            alt="达成率截图凭证"
            loading="lazy"
          />
        ) : (
          "查看凭证"
        )}
      </button>
      {open && (
        <Modal title="截图凭证" close={() => setOpen(false)} wide>
          {originalAccess ? (
            <img
              src={evidenceUrl(id, "original", originalAccess)}
              alt="达成率截图凭证"
              onError={() => setError("凭证读取失败，请重新验证")}
            />
          ) : (
            <EvidenceVerification
              siteKey={siteKey}
              variant="original"
              target={id}
              onVerified={({ access }) => setOriginalAccess(access)}
            />
          )}
          {error && (
            <p className="error" role="alert">
              {error}{" "}
              <button
                className="text-button"
                onClick={() => {
                  setError("");
                  setOriginalAccess("");
                }}
              >
                重新验证
              </button>
            </p>
          )}
        </Modal>
      )}
    </>
  );
}

export function ScreenshotInput({
  file,
  setFile,
  publicProof = false,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
  publicProof?: boolean;
}) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="field">
      <span className="field-label">截图凭证</span>
      {publicProof && (
        <p className="form-hint">
          您上传的凭证将可被所有人浏览，请注意保护您的隐私。
        </p>
      )}
      <label className={`upload ${file ? "has-image" : ""}`}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="上传截图凭证"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        {preview ? (
          <img src={preview} alt="已选择的截图" />
        ) : (
          <>
            <Icon name="upload" size={24} />
            <span>选择截图</span>
            <small>PNG、JPG、WebP · 最大 10 MB</small>
          </>
        )}
      </label>
      {file && (
        <div className="file-caption">
          <span>{file.name}</span>
          <button
            type="button"
            className="text-button"
            onClick={() => setFile(null)}
          >
            移除
          </button>
        </div>
      )}
    </div>
  );
}

export async function appendScreenshot(form: FormData, file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("截图不超过 10 MB");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("截图无法读取，请重新选择 PNG、JPG 或 WebP 图片");
  });
  const canvas = document.createElement("canvas");
  const encode = async (edge: number, quality: number) => {
    const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("截图无法压缩"))),
        "image/webp",
        quality,
      ),
    );
  };
  try {
    let original = await encode(2560, 0.85);
    for (const edge of [2560, 2200, 1800]) {
      if (original.size <= 256 * 1024) break;
      original = await encode(edge, 0.72);
    }
    const thumbnail = await encode(360, 0.7);
    if (original.size > 256 * 1024 || thumbnail.size > 24 * 1024)
      throw new Error("截图较复杂，请选择只包含活动页面的截图");
    form.set("image", original, "screenshot.webp");
    form.set("thumbnail", thumbnail, "thumbnail.webp");
  } finally {
    bitmap.close();
  }
}
