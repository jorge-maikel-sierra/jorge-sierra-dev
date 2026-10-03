"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

type TurnstileApi = {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = {
  /** Waits briefly for a token; null if the challenge could not complete. */
  getToken(): Promise<string | null>;
  reset(): void;
};

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
// Cloudflare's documented always-pass test key, used only outside production.
const TEST_SITE_KEY = "1x00000000000000000000AA";

let scriptPromise: Promise<void> | null = null;

function loadScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.append(script);
  });
  return scriptPromise;
}

const siteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  (process.env.NODE_ENV === "production" ? "" : TEST_SITE_KEY);

// Invisible unless Cloudflare needs an interaction (RF-5.3). The script loads
// when the contact section gets close to the viewport, not on page load.
export function Turnstile({ ref }: { ref: Ref<TurnstileHandle> }) {
  const container = useRef<HTMLDivElement>(null);
  const token = useRef<string | null>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element || !siteKey) return;
    let cancelled = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void loadScript().then(() => {
          if (cancelled || !window.turnstile) return;
          widget.current = window.turnstile.render(element, {
            sitekey: siteKey,
            appearance: "interaction-only",
            callback: (value: string) => {
              token.current = value;
            },
            "expired-callback": () => {
              token.current = null;
            },
            "error-callback": () => {
              token.current = null;
            },
          });
        });
      },
      { rootMargin: "600px" },
    );
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (widget.current) window.turnstile?.remove(widget.current);
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      async getToken() {
        for (let waited = 0; !token.current && waited < 8000; waited += 200) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        return token.current;
      },
      reset() {
        token.current = null;
        if (widget.current) window.turnstile?.reset(widget.current);
      },
    }),
    [],
  );

  return <div ref={container} />;
}
