/**
 * BotForces Extension — Background Service Worker
 *
 * Acts as the messaging hub between the BotForces web app and the
 * content script running on codeforces.com.
 */

// ─── External Messages (from BotForces web app) ─────────────────────────

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    console.log("[BotForces BG] External message:", message.type, "from:", sender.url);

    switch (message.type) {
      case "PING":
        handlePing(sendResponse);
        return true; // async response

      case "SUBMIT":
        handleSubmit(message.data, sendResponse);
        return true; // async response

      case "CHECK_LOGIN":
        handleCheckLogin(sendResponse);
        return true; // async response

      default:
        sendResponse({ error: "Unknown message type" });
        return false;
    }
  }
);

// ─── Internal Messages (from content script) ────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[BotForces BG] Internal message:", message.type);

  if (message.type === "SUBMISSION_RESULT") {
    // Forward the result to the BotForces web app
    // Store it temporarily so we can notify the web app
    chrome.storage.local.set({
      lastSubmissionResult: {
        ...message.data,
        timestamp: Date.now(),
      },
    });
    sendResponse({ received: true });
  }

  return false;
});

// ─── Handlers ───────────────────────────────────────────────────────────

async function handlePing(sendResponse) {
  const isLoggedIn = await checkCodeforcesLogin();
  sendResponse({
    type: "PONG",
    version: chrome.runtime.getManifest().version,
    isLoggedIn,
  });
}

async function handleSubmit(data, sendResponse) {
  const { contestId, problemIndex, code, language } = data;

  if (!contestId || !problemIndex || !code || !language) {
    sendResponse({ error: "Missing required fields: contestId, problemIndex, code, language" });
    return;
  }

  // Check if user is logged into Codeforces
  const isLoggedIn = await checkCodeforcesLogin();
  if (!isLoggedIn) {
    sendResponse({
      error: "Not logged into Codeforces. Please log in at codeforces.com first.",
    });
    return;
  }

  try {
    // Find or create a tab with the Codeforces submission page
    const submitUrl = `https://codeforces.com/contest/${contestId}/submit/problem/${problemIndex}`;

    // Open the submission page in a new tab
    const tab = await chrome.tabs.create({
      url: submitUrl,
      active: false, // Don't steal focus
    });

    // Wait for the tab to finish loading, then send the submission data
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);

        // Send the code to the content script
        chrome.tabs.sendMessage(tab.id, {
          type: "FILL_AND_SUBMIT",
          data: { code, language, contestId, problemIndex },
        });
      }
    });

    sendResponse({ success: true, message: "Submission initiated" });
  } catch (error) {
    console.error("[BotForces BG] Submit error:", error);
    sendResponse({ error: error.message || "Failed to submit" });
  }
}

async function handleCheckLogin(sendResponse) {
  const isLoggedIn = await checkCodeforcesLogin();
  sendResponse({ isLoggedIn });
}

/**
 * Check if the user is logged into Codeforces by looking for session cookies.
 */
async function checkCodeforcesLogin() {
  try {
    const cookies = await chrome.cookies.getAll({ domain: "codeforces.com" });
    return cookies.some(c => c.name === "X-User" || c.name === "RC" || c.name === "X-User-Sha1");
  } catch {
    return false;
  }
}
