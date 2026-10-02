import type {
  AchievementStats,
  Distribution,
  Page,
  Submission,
} from "../shared/types";
import { formatRate } from "../shared/rate";

export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const evidenceUrl = (id: string, variant: "thumb" | "original") =>
  `${API_URL}/api/evidence/${id}/${variant}`;

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
  const response = await fetch(`${API_URL}/api${path}`, { ...init, headers });
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
  submissions: (id: number, rate: number, cursor: number | null = null) =>
    request<Page<Submission>>(
      `/achievements/${id}/submissions?rate=${formatRate(rate)}${cursor === null ? "" : `&cursor=${cursor}`}`,
    ),
  submit: (form: FormData) =>
    request<{ id: number }>("/submissions", { method: "POST", body: form }),
  report: (form: FormData) =>
    request("/reports", { method: "POST", body: form }),
};
