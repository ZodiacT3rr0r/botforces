"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handle = searchParams.get("handle") || "";

  const navItems = [
    {
      href: `/dashboard?handle=${handle}`,
      label: "Dashboard",
      icon: (
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      ),
      matchPath: "/dashboard",
    },
    {
      href: `/contests?handle=${handle}`,
      label: "Contests",
      icon: (
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </>
      ),
      matchPath: "/contests",
    },
    {
      href: `/editor?handle=${handle}`,
      label: "Editor",
      icon: (
        <>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </>
      ),
      matchPath: "/editor",
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ─── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-64 border-r border-border-subtle bg-bg-secondary/50 flex flex-col flex-shrink-0 hidden lg:flex">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border-subtle">
          <Link href="/" className="flex items-center gap-2">
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
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.matchPath || pathname.startsWith(item.matchPath + "/");
            return (
              <Link
                key={item.matchPath}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User handle at bottom */}
        {handle && (
          <div className="px-4 py-4 border-t border-border-subtle">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold text-text-muted">
                {handle[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{handle}</div>
                <div className="text-text-muted text-xs">Codeforces</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ─── Mobile top bar ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-secondary/50">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-indigo/20 flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-accent-indigo"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-base font-bold">
              Bot<span className="gradient-text">Forces</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.matchPath || pathname.startsWith(item.matchPath + "/");
              return (
                <Link
                  key={item.matchPath}
                  href={item.href}
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-accent-indigo bg-accent-indigo/10"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {item.icon}
                  </svg>
                </Link>
              );
            })}
          </nav>
        </header>

        {/* ─── Main Content ──────────────────────────────────────────── */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
      <DashboardShellInner>{children}</DashboardShellInner>
    </Suspense>
  );
}
