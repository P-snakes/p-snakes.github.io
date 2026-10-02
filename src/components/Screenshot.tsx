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
