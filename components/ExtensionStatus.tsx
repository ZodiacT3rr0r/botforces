"use client";

import { useEffect, useState } from "react";

export default function ExtensionStatus() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Try to detect the extension via window.postMessage
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === "BOTFORCES_EXTENSION_PONG"
      ) {
        if (typeof event.data.extensionId === "string" && event.data.extensionId) {
          localStorage.setItem("botforces_extension_id", event.data.extensionId);
        }
        setConnected(true);
        setChecking(false);
      }
    };

    window.addEventListener("message", handleMessage);

    // Send a ping
    window.postMessage({ type: "BOTFORCES_EXTENSION_PING" }, "*");

    // Timeout after 2 seconds
    const timeout = setTimeout(() => {
      setChecking(false);
    }, 2000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        checking
          ? "bg-bg-elevated text-text-muted"
          : connected
            ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
            : "bg-verdict-wa/10 text-verdict-wa/70 border border-verdict-wa/20"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          checking
            ? "bg-text-muted animate-pulse"
            : connected
              ? "bg-accent-emerald animate-pulse-glow"
              : "bg-verdict-wa/50"
        }`}
      />
      {checking
        ? "Checking extension..."
        : connected
          ? "Extension connected"
          : "Extension not detected"}
    </div>
  );
}
