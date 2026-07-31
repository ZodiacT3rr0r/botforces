/**
 * BotForces Extension — Content Script
 *
 * Injected into codeforces.com pages. Handles:
 * 1. Responding to PING messages from the web app (via window.postMessage)
 * 2. Filling and submitting solutions on the submission page
 * 3. Watching for verdict results and reporting back
 */

// ─── Window Message Listener (for web app communication fallback) ────────

window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "BOTFORCES_EXTENSION_PING") {
    window.postMessage({ type: "BOTFORCES_EXTENSION_PONG" }, "*");
  }
});

// ─── Chrome Runtime Message Listener ────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[BotForces CS] Received:", message.type);

  if (message.type === "FILL_AND_SUBMIT") {
    fillAndSubmit(message.data)
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({ error: error.message || "Submission failed" })
      );
    return true; // async response
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
  const { code, language, contestId, problemIndex } = data;

  // Wait for the page to fully load
  await waitForElement("#sourceCodeTextarea, .submit-form");

  // 1. Select the problem (if the dropdown exists)
  const problemSelect = document.querySelector('select[name="submittedProblemIndex"]');
  if (problemSelect) {
    const options = Array.from(problemSelect.options);
    const targetOption = options.find(
      (opt) =>
        opt.value === problemIndex ||
        opt.text.startsWith(problemIndex + ".")  ||
        opt.text.startsWith(problemIndex + " ")
    );
    if (targetOption) {
      problemSelect.value = targetOption.value;
      problemSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // 2. Select the language
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

  // 3. Fill in the source code
  // Codeforces uses a CodeMirror editor or a textarea
  const textarea = document.querySelector("#sourceCodeTextarea");
  if (textarea) {
    textarea.value = code;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Also try to set the CodeMirror editor if it exists
  const cmEditor = document.querySelector(".CodeMirror");
  if (cmEditor && cmEditor.CodeMirror) {
    cmEditor.CodeMirror.setValue(code);
  }

  // 4. Submit the form
  await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay

  const submitButton = document.querySelector('.submit-form input[type="submit"], .submit-form button[type="submit"], #singlePageSubmitButton');
  if (submitButton) {
    submitButton.click();

    // 5. Watch for the result
    await watchForVerdict(contestId, problemIndex);
  } else {
    throw new Error("Could not find submit button");
  }

  return { success: true };
}

/**
 * Watch the page for the submission verdict.
 * After form submission, CF redirects to the status page.
 */
async function watchForVerdict(contestId, problemIndex) {
  // Wait for page navigation (CF redirects after submit)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Check if we're on a status/my page now
  const currentUrl = window.location.href;
  if (currentUrl.includes("/my") || currentUrl.includes("/status")) {
    // Look for the verdict in the submission table
    const checkVerdict = () => {
      const rows = document.querySelectorAll("table.status-frame-datatable tr");
      if (rows.length > 1) {
        const firstDataRow = rows[1]; // Skip header
        const verdictCell = firstDataRow.querySelector(".status-verdict-cell, td:nth-child(6)");
        const submissionIdCell = firstDataRow.querySelector("td:first-child a");

        if (verdictCell) {
          const verdictText = verdictCell.textContent.trim();
          const submissionId = submissionIdCell
            ? parseInt(submissionIdCell.textContent.trim())
            : 0;

          // Check if verdict is final (not "Testing" or "In queue")
          if (
            verdictText &&
            !verdictText.includes("queue") &&
            !verdictText.includes("Running") &&
            !verdictText.includes("Testing")
          ) {
            // Send result back to background
            chrome.runtime.sendMessage({
              type: "SUBMISSION_RESULT",
              data: {
                contestId,
                problemIndex,
                submissionId,
                verdict: parseVerdict(verdictText),
                verdictText,
              },
            });
            return true;
          }
        }
      }
      return false;
    };

    // Poll for verdict (CF updates the page)
    for (let i = 0; i < 30; i++) {
      if (checkVerdict()) return;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Refresh to check for updates
      if (i > 0 && i % 5 === 0) {
        window.location.reload();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
}

/**
 * Parse a CF verdict string into our standard verdict enum.
 */
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

/**
 * Wait for an element to appear on the page.
 */
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
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
      // Resolve anyway — the page might already be loaded
      resolve(document.querySelector(selector));
    }, timeout);
  });
}
