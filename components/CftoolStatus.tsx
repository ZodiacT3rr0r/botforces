"use client";

import { useState, useEffect, useCallback } from "react";

interface StatusState {
  loggedIn: boolean;
  handle: string | null;
  loading: boolean;
}

/**
 * CftoolStatus
 *
 * Renders a card showing whether the local cf-tool CLI is authenticated
 * with Codeforces. If not, it exposes a login form that drives the
 * cf-tool binary via /api/cftool/status (POST).
 */
export default function CftoolStatus() {
  const [status, setStatus] = useState<StatusState>({
    loggedIn: false,
    handle: null,
    loading: true,
  });
  const [showLogin, setShowLogin] = useState(false);
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginOutput, setLoginOutput] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setStatus((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/cftool/status");
      const data = await res.json();
      setStatus({ loggedIn: data.loggedIn, handle: data.handle, loading: false });
      if (!data.loggedIn) setShowLogin(true);
    } catch {
      setStatus({ loggedIn: false, handle: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    setError(null);
    setLoginOutput(null);

    try {
      const res = await fetch("/api/cftool/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Login failed. Check your credentials.");
        setLoginOutput(data.detail || null);
      } else {
        setStatus({ loggedIn: true, handle: data.handle, loading: false });
        setShowLogin(false);
        setPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLogging(false);
    }
  };

  // ── Logged in state ────────────────────────────────────────────────────────
  if (!status.loading && status.loggedIn) {
    return (
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-accent-emerald/15 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-accent-emerald"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-emerald border-2 border-bg-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary">cf-tool Connected</p>
            <p className="text-[11px] text-text-muted">
              Logged in as{" "}
              <span className="text-accent-emerald font-medium">{status.handle}</span>
            </p>
          </div>
        </div>
        <button
          onClick={checkStatus}
          className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (status.loading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bg-elevated" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-bg-elevated rounded" />
            <div className="h-2.5 w-20 bg-bg-elevated rounded" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not logged in / login form ─────────────────────────────────────────────
  return (
    <div className="glass-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-verdict-wa/10 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-verdict-wa"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-verdict-wa border-2 border-bg-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-text-primary">cf-tool Not Configured</p>
          <p className="text-[11px] text-text-muted">
            Log in to enable direct submissions
          </p>
        </div>
      </div>

      {/* Login form */}
      {showLogin && (
        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Codeforces handle or email"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
              autoComplete="username"
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-indigo transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-indigo transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] text-verdict-wa leading-snug">{error}</p>
          )}

          {loginOutput && (
            <pre className="text-[10px] text-text-muted bg-bg-elevated rounded-lg p-2 max-h-24 overflow-auto leading-relaxed">
              {loginOutput}
            </pre>
          )}

          <button
            type="submit"
            disabled={logging || !handle || !password}
            className="w-full py-2 bg-accent-indigo/15 hover:bg-accent-indigo/25 disabled:opacity-50 disabled:cursor-not-allowed text-accent-indigo border border-accent-indigo/30 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            {logging ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Authenticating...
              </>
            ) : (
              "Connect cf-tool"
            )}
          </button>

          <p className="text-[10px] text-text-muted leading-snug">
            Your credentials are used only to authenticate the local cf-tool binary.
            They are not stored by BotForces.
          </p>
        </form>
      )}

      {!showLogin && (
        <button
          onClick={() => setShowLogin(true)}
          className="text-xs text-accent-indigo hover:underline"
        >
          Configure Login
        </button>
      )}
    </div>
  );
}
