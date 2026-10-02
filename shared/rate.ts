export const RATE_SCALE = 1_000_000;

export function parseRate(value: string): number {
  if (!/^\d{1,3}(\.\d{1,6})?$/.test(value))
    throw new Error("请输入 0–100 的达成率，最多六位小数");
  const [whole, fraction = ""] = value.split(".");
  const rate = Number(whole) * RATE_SCALE + Number(fraction.padEnd(6, "0"));
  if (rate > 100 * RATE_SCALE) throw new Error("达成率不能超过 100%");
  return rate;
}

export function formatRate(rate: number): string {
  const whole = Math.floor(rate / RATE_SCALE);
  const fraction = String(rate % RATE_SCALE)
    .padStart(6, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}
