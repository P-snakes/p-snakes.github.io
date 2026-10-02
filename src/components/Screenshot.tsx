import { useEffect, useState } from "react";
import { evidenceUrl } from "../api";
import { Icon } from "./Icons";
import { Modal } from "./Modal";

export function Screenshot({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="thumbnail"
        aria-label="查看截图凭证"
        onClick={() => setOpen(true)}
      >
        <img
          src={evidenceUrl(id, "thumb")}
          alt="达成率截图凭证"
          loading="lazy"
        />
      </button>
      {open && (
        <Modal title="截图凭证" close={() => setOpen(false)} wide>
          <img src={evidenceUrl(id, "original")} alt="达成率截图凭证" />
        </Modal>
      )}
    </>
  );
}

export function ScreenshotInput({
  file,
  setFile,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
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
  const scale = Math.min(1, 360 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const thumbnail = await new Promise<Blob>((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.8),
  );
  form.set("image", file);
  form.set("thumbnail", thumbnail, "thumbnail.webp");
}
