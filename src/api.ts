import type {
  AchievementStats,
  Distribution,
  Page,
  Submission,
} from "../shared/types";
import { formatRate } from "../shared/rate";
import {
  readSubmissionIdentity,
  saveSubmissionIdentity,
} from "./submission-identity";

export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export interface Snapshot {
  items: AchievementStats[];
  totalSubmissions: number;
  mode: "normal" | "snapshot" | "closed";
  day: string;
  generatedAt: string | null;
  eventName: string;
  siteKey: string;
}
export function restrictBrowsing() {
  window.dispatchEvent(new Event("snapshot-mode"));
}
export async function readSnapshot(): Promise<Snapshot> {
  const response = await fetch(`${import.meta.env.BASE_URL}snapshot.json`, {
    cache: "no-cache",
  });
  if (!response.ok) throw new Error("快照暂时无法读取");
  return response.json();
}
export async function readRecords(
  id: number,
  version: string,
): Promise<Submission[]> {
  const response = await fetch(
    `${import.meta.env.BASE_URL}records/${id}${version ? "." + version : ""}.json`,
    { cache: version ? "force-cache" : "no-cache" },
  );
  if (!response.ok) throw new Error("提交记录快照暂时无法读取");
  return response.json();
}
export const evidenceUrl = (
  id: string,
  variant: "thumb" | "original",
  access: string,
) =>
  `${API_URL}/api/evidence/${id}/${variant}?access=${encodeURIComponent(access)}`;

export interface EvidenceAccess {
  access: string;
  expiresAt: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, { ...init, headers });
  } catch {
    restrictBrowsing();
    throw new ApiError("接口暂时不可用，达成率可通过快照查询", 503);
  }
  if (response.status === 503) restrictBrowsing();
  if (path === "/submissions") {
    const browser = response.headers.get("X-Submission-Browser");
    if (browser) saveSubmissionIdentity(browser);
  }
  if (!response.headers.get("Content-Type")?.includes("application/json")) {
    restrictBrowsing();
    throw new ApiError("接口暂时不可用，达成率可通过快照查询", response.status);
  }
  const result = await response.json();
  if (!response.ok) throw new ApiError(result.error, response.status);
  return result;
}

export const api = {
  config: () =>
    request<{ eventName: string; siteKey: string; capacity: number }>(
      "/config",
    ),
  stats: () =>
    request<{ items: AchievementStats[]; totalSubmissions: number }>("/stats"),
  detail: (id: number) =>
    request<{ distribution: Distribution[] }>(`/achievements/${id}`),
  view: (id: number) => request(`/achievements/${id}/view`, { method: "POST" }),
  evidenceAccess: (
    variant: "thumb" | "original",
    target: number | string,
    token: string,
  ) =>
    request<EvidenceAccess>("/evidence-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variant,
        token,
        ...(variant === "thumb" ? { achievementId: target } : { id: target }),
      }),
    }),
  submissions: (id: number, rate: number, cursor: number | null = null) =>
    request<Page<Submission>>(
      `/achievements/${id}/submissions?rate=${formatRate(rate)}${cursor === null ? "" : `&cursor=${cursor}`}`,
    ),
  submit: (form: FormData) => {
    form.set("browserToken", readSubmissionIdentity());
    return request<{ id: number }>("/submissions", {
      method: "POST",
      body: form,
    });
  },
  report: (form: FormData) =>
    request("/reports", { method: "POST", body: form }),
};
