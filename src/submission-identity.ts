const KEY = "achievement_browser";

export function readSubmissionIdentity() {
  const cookie = document.cookie
    .split("; ")
    .find((value) => value.startsWith(KEY + "="));
  return cookie
    ? decodeURIComponent(cookie.slice(KEY.length + 1))
    : localStorage.getItem(KEY) || "";
}

export function saveSubmissionIdentity(token: string) {
  document.cookie = `${KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  localStorage.setItem(KEY, token);
}
