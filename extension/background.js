/**
 * BotForces Extension — Background Service Worker (Manifest V3)
 *
 * MV3-resilient orchestration between the BotForces web app and codeforces.com:
 * - Registers all event listeners synchronously at top-level (survives SW idle suspension)
 * - Persists pendingSubmission & lastAppOrigin in chrome.storage.local
 * - Uses chrome.scripting.executeScript({ world: "MAIN" }) to populate Codeforces'
 *   Ace/CodeMirror page-world editor cleanly
 * - Survives the POST -> 302 redirect from /submit to /my via top-level tabs.onUpdated
 * - Posts the judged verdict back to POST ${appOrigin}/api/submit to close the loop
 */

const PENDING_KEY = "pendingSubmission";
const APP_ORIGIN_KEY = "lastAppOrigin";
const VERDICT_ALARM = "botforces_verdict_poll";

// ─── Top-Level Listeners (MV3 Service Worker Safe) ──────────────────────

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    const senderOrigin = sender?.url ? new URL(sender.url).origin : null;
    if (senderOrigin) {
      chrome.storage.local.set({ [APP_ORIGIN_KEY]: senderOrigin });
    }

    switch (message.type) {
      case "PING":
        handlePing(sendResponse);
        return true;

      case "SUBMIT":
        handleSubmit(message.data, senderOrigin, sendResponse);
        return true;

      case "CHECK_LOGIN":
        handleCheckLogin(sendResponse);
        return true;

      default:
        sendResponse({ error: "Unknown message type" });
        return false;
    }
  }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REGISTER_APP_ORIGIN" && message.origin) {
    chrome.storage.local.set({ [APP_ORIGIN_KEY]: message.origin });
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === "SUBMISSION_RESULT") {
    finalizeSubmissionResult(message.data)
      .then(() => sendResponse({ received: true }))
      .catch((err) => sendResponse({ received: false, error: err.message }));
    return true;
  }

  return false;
});

/**
 * Top-level tab lifecycle listener so pending submissions survive both
 * MV3 service-worker suspension and the full-page POST -> 302 redirect from
 * /contest/{id}/submit to /my or /status.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;

  const stored = await chrome.storage.local.get(PENDING_KEY);
  const pending = stored[PENDING_KEY];
  if (!pending || pending.tabId !== tabId) return;

  const url = tab.url || "";

  if (pending.stage === "opening" && url.includes("/submit")) {
    await chrome.storage.local.set({
      [PENDING_KEY]: { ...pending, stage: "submitting" },
    });

    // Inject page-world Ace/CodeMirror helper before content script clicks submit
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: setPageWorldEditorCode,
        args: [pending.code],
      });
    } catch {
      // Fallback: content.js still fills #sourceCodeTextarea directly
    }

    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "FILL_AND_SUBMIT",
        data: {
          code: pending.code,
          language: pending.language,
          contestId: pending.contestId,
          problemIndex: pending.problemIndex,
        },
      });
      await chrome.storage.local.set({
        [PENDING_KEY]: { ...pending, stage: "awaiting_redirect" },
      });
    } catch (err) {
      console.error("[BotForces BG] Failed to send FILL_AND_SUBMIT:", err);
    }
    return;
  }

  if (
    (pending.stage === "awaiting_redirect" || pending.stage === "polling") &&
    (url.includes("/my") || url.includes("/status"))
  ) {
    await chrome.storage.local.set({
      [PENDING_KEY]: { ...pending, stage: "polling" },
    });
    await checkTabVerdictOrScheduleAlarm(tabId, pending);
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== VERDICT_ALARM) return;

  const stored = await chrome.storage.local.get(PENDING_KEY);
  const pending = stored[PENDING_KEY];
  if (!pending) return;

  // Stop polling after 2 minutes
  if (Date.now() - pending.startedAt > 120000) {
    await chrome.storage.local.remove(PENDING_KEY);
    return;
  }

  try {
    await chrome.tabs.reload(pending.tabId);
  } catch {
    await chrome.storage.local.remove(PENDING_KEY);
  }
});

// ─── Main-World Editor Helper ───────────────────────────────────────────

function setPageWorldEditorCode(code) {
  try {
    if (window.ace && document.getElementById("editor")) {
      window.ace.edit("editor").setValue(code, -1);
    }
    const cm = document.querySelector(".CodeMirror");
    if (cm && cm.CodeMirror) {
      cm.CodeMirror.setValue(code);
    }
  } catch {
    // Ignore if Codeforces is in plain textarea mode
  }
}

// ─── Handlers ───────────────────────────────────────────────────────────

async function handlePing(sendResponse) {
  const isLoggedIn = await checkCodeforcesLogin();
  sendResponse({
    type: "PONG",
    extensionId: chrome.runtime.id,
    version: chrome.runtime.getManifest().version,
    isLoggedIn,
  });
}

async function handleSubmit(data, senderOrigin, sendResponse) {
  const { contestId, problemIndex, problemName, handle, code, language } = data;
  const appOrigin = data.appOrigin || senderOrigin || "http://localhost:3000";

  if (!contestId || !problemIndex || !code || !language) {
    sendResponse({
      error: "Missing required fields: contestId, problemIndex, code, language",
    });
    return;
  }

  const isLoggedIn = await checkCodeforcesLogin();
  if (!isLoggedIn) {
    sendResponse({
      error:
        "Not logged into Codeforces. Please log in at codeforces.com first.",
    });
    return;
  }

  try {
    const submitUrl = `https://codeforces.com/contest/${contestId}/submit/problem/${problemIndex}`;
    const tab = await chrome.tabs.create({
      url: submitUrl,
      active: false,
    });

    await chrome.storage.local.set({
      [APP_ORIGIN_KEY]: appOrigin,
      [PENDING_KEY]: {
        tabId: tab.id,
        contestId,
        problemIndex,
        problemName: problemName || "",
        handle: handle || "",
        code,
        language,
        appOrigin,
        stage: "opening",
        startedAt: Date.now(),
      },
    });

    sendResponse({
      success: true,
      message: "Submission queued in background tab; tracking verdict...",
    });
  } catch (error) {
    console.error("[BotForces BG] Submit error:", error);
    sendResponse({ error: error.message || "Failed to submit" });
  }
}

async function checkTabVerdictOrScheduleAlarm(tabId, pending) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "READ_VERDICT",
      data: {
        contestId: pending.contestId,
        problemIndex: pending.problemIndex,
      },
    });

    if (response?.final) {
      await finalizeSubmissionResult({
        ...response,
        handle: response.handle || pending.handle,
        problemName: pending.problemName,
        programmingLanguage: pending.language,
        sourceCode: pending.code,
      });
      return;
    }
  } catch {
    // Tab may still be hydrating; retry on next alarm
  }

  // Schedule MV3 alarm instead of blocking in-memory setInterval
  chrome.alarms.create(VERDICT_ALARM, { delayInMinutes: 0.1 }); // ~6s
}

async function finalizeSubmissionResult(result) {
  const stored = await chrome.storage.local.get([PENDING_KEY, APP_ORIGIN_KEY]);
  const pending = stored[PENDING_KEY];
  const appOrigin =
    pending?.appOrigin || stored[APP_ORIGIN_KEY] || "http://localhost:3000";

  const payload = {
    handle: result.handle || pending?.handle || "",
    submissionId: result.submissionId,
    contestId: result.contestId || pending?.contestId,
    problemIndex: result.problemIndex || pending?.problemIndex || "",
    problemName: result.problemName || pending?.problemName || "",
    verdict: result.verdict,
    verdictText: result.verdictText || result.verdict,
    programmingLanguage: result.programmingLanguage || pending?.language || "",
    sourceCode: result.sourceCode || pending?.code || "",
    timestamp: Date.now(),
  };

  await chrome.storage.local.set({ lastSubmissionResult: payload });
  await chrome.storage.local.remove(PENDING_KEY);
  await chrome.alarms.clear(VERDICT_ALARM);

  // Close the loop by persisting the judged submission to BotForces' backend API
  if (payload.handle && payload.submissionId && payload.contestId && payload.verdict) {
    try {
      await fetch(`${appOrigin}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("[BotForces BG] Failed to POST /api/submit:", err);
    }
  }

  // Clean up background submission tab once judged
  if (pending?.tabId) {
    try {
      await chrome.tabs.remove(pending.tabId);
    } catch {
      // Tab may already have been closed by user
    }
  }
}

async function handleCheckLogin(sendResponse) {
  const isLoggedIn = await checkCodeforcesLogin();
  sendResponse({ isLoggedIn });
}

async function checkCodeforcesLogin() {
  try {
    const cookies = await chrome.cookies.getAll({ domain: "codeforces.com" });
    return cookies.some(
      (c) => c.name === "X-User" || c.name === "RC" || c.name === "X-User-Sha1"
    );
  } catch {
    return false;
  }
}
