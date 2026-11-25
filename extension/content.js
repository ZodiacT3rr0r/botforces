/**
 * BotForces Extension — Content Script (Isolated World)
 *
 * Injected into BotForces web app origins (localhost:3000 & *.vercel.app)
 * and codeforces.com pages. Handles:
 * 1. Auto-advertising chrome.runtime.id in BOTFORCES_EXTENSION_PONG so the
 *    web app never needs manual extension ID setup
 * 2. Filling & submitting the Codeforces form (DOM textarea + toggle fallback)
 * 3. Reading a single-pass verdict snapshot from /my or /status after redirect
 *    (polling/reloading is orchestrated safely in background.js via chrome.alarms)
 */

// ─── Web App Handshake (auto-populates botforces_extension_id) ──────────

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data && event.data.type === "BOTFORCES_EXTENSION_PING") {
    window.postMessage(
      {
        type: "BOTFORCES_EXTENSION_PONG",
        extensionId: chrome.runtime.id,
      },
      window.location.origin
    );
    chrome.runtime.sendMessage({
      type: "REGISTER_APP_ORIGIN",
      origin: window.location.origin,
    });
  }
});

// ─── Chrome Runtime Message Listener ────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FILL_AND_SUBMIT") {
    fillAndSubmit(message.data)
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({ error: error.message || "Submission failed" })
      );
    return true;
  }

  if (message.type === "READ_VERDICT") {
    sendResponse(readVerdictSnapshot(message.data));
    return false;
  }
});

// ─── Language Mapping ───────────────────────────────────────────────────

const LANGUAGE_MAP = {
  "C++": "GNU C++20 (64)",
  "C++ 20": "GNU C++20 (64)",
  "C++ 17": "GNU C++17 7.3.0",
  C: "GNU C11",
  Python: "Python 3",
  Python3: "Python 3",
  Java: "Java 21",
  JavaScript: "Node.js",
  Kotlin: "Kotlin 1.9",
  Rust: "Rust 1.75.0",
  Go: "Go 1.22.2",
};

// ─── Submit Logic ───────────────────────────────────────────────────────

async function fillAndSubmit(data) {
  const { code, language, problemIndex } = data;

  await waitForElement("#sourceCodeTextarea, .submit-form");

  // 1. Select the problem (if dropdown exists)
  const problemSelect = document.querySelector(
    'select[name="submittedProblemIndex"]'
  );
  if (problemSelect) {
    const options = Array.from(problemSelect.options);
    const targetOption = options.find(
      (opt) =>
        opt.value === problemIndex ||
        opt.text.startsWith(problemIndex + ".") ||
        opt.text.startsWith(problemIndex + " ")
    );
    if (targetOption) {
      problemSelect.value = targetOption.value;
      problemSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // 2. Select the compiler/language
  const langSelect = document.querySelector('select[name="programTypeId"]');
  if (langSelect) {
    const options = Array.from(langSelect.options);
    const mappedLang = LANGUAGE_MAP[language] || language;
    const targetOption = options.find(
      (opt) =>
        opt.text.includes(mappedLang) ||
        opt.text.toLowerCase().includes(language.toLowerCase())
    );
    if (targetOption) {
      langSelect.value = targetOption.value;
      langSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // 3. Fill plain #sourceCodeTextarea (page-world Ace/CodeMirror is handled
  //    by background.js via chrome.scripting.executeScript({ world: "MAIN" }))
  const toggleEditorCheckbox = document.querySelector("#toggleEditorCheckbox");
  if (toggleEditorCheckbox && !toggleEditorCheckbox.checked) {
    toggleEditorCheckbox.click();
  }

  const textarea = document.querySelector("#sourceCodeTextarea");
  if (textarea) {
    textarea.value = code;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // 4. Click submit (background.js takes over after the 302 redirect to /my)
  await new Promise((resolve) => setTimeout(resolve, 350));

  const submitButton = document.querySelector(
    '.submit-form input[type="submit"], .submit-form button[type="submit"], #singlePageSubmitButton'
  );
  if (!submitButton) {
    throw new Error("Could not find submit button");
  }

  submitButton.click();
  return { success: true };
}

/**
 * Reads the top submission row on /my or /status without blocking loops or reloads.
 */
function readVerdictSnapshot(data) {
  const { contestId, problemIndex } = data || {};
  const rows = document.querySelectorAll("table.status-frame-datatable tr");
  if (rows.length <= 1) {
    return { final: false };
  }

  const firstDataRow = rows[1];
  const verdictCell = firstDataRow.querySelector(
    ".status-verdict-cell, td:nth-child(6)"
  );
  const submissionIdCell = firstDataRow.querySelector("td:first-child a");
  const handleLink = firstDataRow.querySelector("td:nth-child(3) a");

  if (!verdictCell) {
    return { final: false };
  }

  const verdictText = verdictCell.textContent.trim();
  const submissionId = submissionIdCell
    ? Number.parseInt(submissionIdCell.textContent.trim(), 10)
    : 0;
  const handle = handleLink ? handleLink.textContent.trim() : "";

  const isPending =
    !verdictText ||
    verdictText.includes("queue") ||
    verdictText.includes("Running") ||
    verdictText.includes("Testing");

  if (isPending) {
    return { final: false, verdictText, submissionId };
  }

  return {
    final: true,
    handle,
    contestId,
    problemIndex,
    submissionId,
    verdict: parseVerdict(verdictText),
    verdictText,
  };
}

function parseVerdict(text) {
  const lower = text.toLowerCase();
  if (lower.includes("accepted")) return "OK";
  if (lower.includes("wrong answer")) return "WRONG_ANSWER";
  if (lower.includes("time limit")) return "TIME_LIMIT_EXCEEDED";
  if (lower.includes("memory limit")) return "MEMORY_LIMIT_EXCEEDED";
  if (lower.includes("runtime error")) return "RUNTIME_ERROR";
  if (lower.includes("compilation error")) return "COMPILATION_ERROR";
  if (lower.includes("idleness")) return "IDLENESS_LIMIT_EXCEEDED";
  return "UNKNOWN";
}

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
}
