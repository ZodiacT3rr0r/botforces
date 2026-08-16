"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";

const LANGUAGE_OPTIONS = [
  { value: "cpp", label: "C++ 20", monacoLang: "cpp" },
  { value: "python", label: "Python 3", monacoLang: "python" },
  { value: "java", label: "Java 21", monacoLang: "java" },
  { value: "javascript", label: "JavaScript", monacoLang: "javascript" },
  { value: "kotlin", label: "Kotlin", monacoLang: "kotlin" },
  { value: "rust", label: "Rust", monacoLang: "rust" },
  { value: "go", label: "Go", monacoLang: "go" },
  { value: "c", label: "C", monacoLang: "c" },
];

const DEFAULT_CODE: Record<string, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t;
    cin >> t;
    while (t--) {
        // Your solution here
    }
    
    return 0;
}
`,
  python: `import sys
input = sys.stdin.readline

def solve():
    # Your solution here
    pass

t = int(input())
for _ in range(t):
    solve()
`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int t = Integer.parseInt(br.readLine().trim());
        while (t-- > 0) {
            // Your solution here
        }
    }
}
`,
  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];

rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    let idx = 0;
    const t = parseInt(lines[idx++]);
    for (let i = 0; i < t; i++) {
        // Your solution here
    }
});
`,
  kotlin: `fun main() {
    val t = readLine()!!.trim().toInt()
    repeat(t) {
        // Your solution here
    }
}
`,
  rust: `use std::io::{self, BufRead, Write, BufWriter};

fn main() {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut out = BufWriter::new(stdout.lock());
    
    let mut lines = stdin.lock().lines();
    let t: usize = lines.next().unwrap().unwrap().trim().parse().unwrap();
    
    for _ in 0..t {
        // Your solution here
    }
}
`,
  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    reader := bufio.NewReader(os.Stdin)
    writer := bufio.NewWriter(os.Stdout)
    defer writer.Flush()

    var t int
    fmt.Fscan(reader, &t)
    for ; t > 0; t-- {
        // Your solution here
    }
}
`,
  c: `#include <stdio.h>

int main() {
    int t;
    scanf("%d", &t);
    while (t--) {
        // Your solution here
    }
    return 0;
}
`,
};

interface CodeEditorProps {
  initialCode?: string;
  initialLanguage?: string;
  contestId?: number;
  problemIndex?: string;
  problemName?: string;
  onSubmit?: (code: string, language: string) => void;
}

export default function CodeEditor({
  initialCode,
  initialLanguage = "cpp",
  contestId,
  problemIndex,
  problemName,
  onSubmit,
}: CodeEditorProps) {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode || DEFAULT_CODE[initialLanguage] || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    // Only reset code if it's still the default template
    const currentDefault = DEFAULT_CODE[language];
    if (code === currentDefault || !code.trim()) {
      setCode(DEFAULT_CODE[newLang] || "");
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    if (!contestId || !problemIndex) {
      setSubmitStatus("No contest/problem selected. Open a problem first.");
      return;
    }

    setSubmitting(true);
    setSubmitStatus(null);

    try {
      if (onSubmit) {
        onSubmit(code, language);
        setSubmitStatus("Submission sent!");
        return;
      }

      // Read handle from URL search params
      const handle =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("handle") || "unknown"
          : "unknown";

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          contestId,
          problemIndex,
          problemName,
          language,
          sourceCode: code,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitStatus(`Error: ${data.error || "Submission failed"}`);
      } else {
        const v = data.verdict || "TESTING";
        const verdictLabel =
          v === "OK" ? "Accepted" :
          v === "WRONG_ANSWER" ? "Wrong Answer" :
          v === "TIME_LIMIT_EXCEEDED" ? "Time Limit Exceeded" :
          v === "RUNTIME_ERROR" ? "Runtime Error" :
          v === "COMPILATION_ERROR" ? "Compilation Error" :
          v;
        setSubmitStatus(`${verdictLabel} — Submission #${data.submissionId}`);
      }
    } catch (error) {
      setSubmitStatus(`Error: ${error instanceof Error ? error.message : "Submit failed"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const monacoLang = LANGUAGE_OPTIONS.find((l) => l.value === language)?.monacoLang || "cpp";

  return (
    <div className="glass-card overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-bg-elevated border border-border-subtle rounded-lg px-3 py-1.5 pr-8 text-sm text-text-primary focus:outline-none focus:border-accent-indigo cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Problem info */}
          {problemIndex && (
            <div className="text-sm text-text-secondary">
              <span className="text-accent-indigo font-medium">{problemIndex}</span>
              {problemName && (
                <span className="text-text-muted"> · {problemName}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Submit status */}
          {submitStatus && (
            <span className="text-xs text-text-secondary max-w-xs truncate">
              {submitStatus}
            </span>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !code.trim()}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-emerald hover:bg-accent-emerald/90 disabled:bg-text-muted disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm"
          >
            {submitting ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            )}
            Submit
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-[400px]">
        <Editor
          height="100%"
          language={monacoLang}
          value={code}
          onChange={(value) => setCode(value || "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            lineNumbers: "on",
            renderLineHighlight: "line",
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "off",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            formatOnPaste: true,
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-bg-card">
              <div className="flex items-center gap-3 text-text-secondary">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                Loading editor...
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
