"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [handle, setHandle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setIsLoading(true);
    router.push(`/dashboard?handle=${encodeURIComponent(handle.trim())}`);
  };

  return (
    <div className="hero-gradient min-h-screen flex flex-col">
      {/* ─── Nav ─────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-indigo/20 flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-accent-indigo"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Bot<span className="gradient-text">Forces</span>
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-text-secondary">
          <a
            href="https://codeforces.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors"
          >
            Codeforces
          </a>
          <a
            href="#features"
            className="hover:text-text-primary transition-colors"
          >
            Features
          </a>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-16">
        {/* Badge */}
        <div className="animate-fade-in-up mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-indigo/10 border border-accent-indigo/20 text-sm text-accent-indigo">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            AI-Powered Analysis
          </div>
        </div>

        {/* Title */}
        <h1
          className="animate-fade-in-up text-5xl md:text-7xl font-extrabold text-center leading-tight tracking-tight max-w-4xl"
          style={{ animationDelay: "0.1s" }}
        >
          Your{" "}
          <span className="gradient-text">Competitive Programming</span>{" "}
          Copilot
        </h1>

        {/* Subtitle */}
        <p
          className="animate-fade-in-up text-text-secondary text-lg md:text-xl text-center max-w-2xl mt-6 leading-relaxed"
          style={{ animationDelay: "0.2s" }}
        >
          Analyze your Codeforces performance with GPT-4. Get personalized
          insights, identify weaknesses, and level up your competitive
          programming skills.
        </p>

        {/* Handle Input */}
        <form
          onSubmit={handleSubmit}
          className="animate-fade-in-up mt-10 w-full max-w-md"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan rounded-2xl opacity-30 group-hover:opacity-50 blur transition-opacity duration-300" />
            <div className="relative flex items-center bg-bg-card rounded-2xl border border-border-subtle overflow-hidden">
              <div className="pl-4 text-text-muted">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Enter Codeforces handle..."
                className="flex-1 bg-transparent px-4 py-4 text-text-primary placeholder:text-text-muted focus:outline-none text-base"
                autoFocus
              />
              <button
                type="submit"
                disabled={!handle.trim() || isLoading}
                className="mr-2 px-5 py-2.5 bg-accent-indigo hover:bg-accent-indigo/90 disabled:bg-text-muted disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 text-sm flex items-center gap-2"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
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
                ) : (
                  <>
                    Analyze
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Feature hints */}
        <div
          className="animate-fade-in-up mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full"
          style={{ animationDelay: "0.4s" }}
          id="features"
        >
          {[
            {
              icon: (
                <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
              ),
              title: "Performance Analytics",
              desc: "Deep dive into your contest history and submission patterns",
            },
            {
              icon: (
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              ),
              title: "AI Code Review",
              desc: "GPT-4 analyzes your failed submissions and explains mistakes",
            },
            {
              icon: (
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              ),
              title: "Practice Roadmap",
              desc: "Personalized topic recommendations to strengthen weak areas",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card p-5 flex flex-col gap-3 group cursor-default"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-accent-indigo group-hover:bg-accent-indigo/20 transition-colors">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  {feature.icon}
                </svg>
              </div>
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="text-center py-6 text-text-muted text-xs">
        Built for competitive programmers · Powered by Codeforces API & GPT-4
      </footer>
    </div>
  );
}
