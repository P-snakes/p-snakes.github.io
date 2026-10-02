import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      remove: (id: string) => void;
    };
  }
}

let loading: Promise<void>;
function loadTurnstile() {
  if (!loading)
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("验证加载失败，请刷新页面"));
      document.head.append(script);
    });
  return loading;
}

export function Turnstile({
  siteKey,
  action,
  onToken,
  onError,
}: {
  siteKey: string;
  action: string;
  onToken: (token: string) => void;
  onError: (error: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onToken, onError });
  callbacks.current = { onToken, onError };
  useEffect(() => {
    let widget: string | undefined;
    let active = true;
    loadTurnstile()
      .then(() => {
        if (!active) return;
        widget = window.turnstile.render(ref.current!, {
          sitekey: siteKey,
          action,
          theme: "light",
          language: "zh-cn",
          callback: (token: string) => callbacks.current.onToken(token),
          "expired-callback": () => callbacks.current.onToken(""),
          "error-callback": () => {
            callbacks.current.onToken("");
            callbacks.current.onError("验证失败，请重试");
          },
        });
      })
      .catch((error) => callbacks.current.onError(error.message));
    return () => {
      active = false;
      if (widget) window.turnstile.remove(widget);
    };
  }, [siteKey, action]);
  return <div className="verification" ref={ref} />;
}
