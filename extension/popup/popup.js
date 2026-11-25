/**
 * BotForces Extension — Popup Script
 */

const DEFAULT_APP_ORIGIN = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  const manifest = chrome.runtime.getManifest();
  document.getElementById("version").textContent = `v${manifest.version}`;

  const stored = await chrome.storage.local.get("lastAppOrigin");
  const appOrigin = stored.lastAppOrigin || DEFAULT_APP_ORIGIN;

  const dashboardLink = document.querySelector('a[href^="http://localhost:3000"]');
  if (dashboardLink) {
    dashboardLink.setAttribute("href", `${appOrigin}/dashboard`);
  }

  checkCodeforcesLogin();
  checkAppConnection(appOrigin);
  checkLastResult();
});

async function checkCodeforcesLogin() {
  const dot = document.getElementById("cf-status-dot");
  const text = document.getElementById("cf-status-text");

  try {
    const cookies = await chrome.cookies.getAll({ domain: "codeforces.com" });
    const isLoggedIn = cookies.some(
      (c) => c.name === "X-User" || c.name === "RC" || c.name === "X-User-Sha1"
    );

    if (isLoggedIn) {
      dot.className = "status-dot connected";
      text.textContent = "Logged into Codeforces";
    } else {
      dot.className = "status-dot disconnected";
      text.textContent = "Not logged into Codeforces";
    }
  } catch {
    dot.className = "status-dot disconnected";
    text.textContent = "Cannot check CF login";
  }
}

async function checkAppConnection(appOrigin) {
  const dot = document.getElementById("app-status-dot");
  const text = document.getElementById("app-status-text");

  try {
    // Hit lightweight /api/health instead of /api/contests so opening the popup
    // never burns a global Codeforces API rate-limit slot.
    const response = await fetch(`${appOrigin}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      dot.className = "status-dot connected";
      text.textContent = "BotForces app running";
    } else {
      dot.className = "status-dot disconnected";
      text.textContent = "BotForces app not responding";
    }
  } catch {
    dot.className = "status-dot disconnected";
    text.textContent = "BotForces app not running";
  }
}

async function checkLastResult() {
  const container = document.getElementById("last-result");

  try {
    const data = await chrome.storage.local.get("lastSubmissionResult");
    const result = data.lastSubmissionResult;

    if (result && Date.now() - result.timestamp < 3600000) {
      container.style.display = "block";

      const verdictEl = document.getElementById("result-verdict");
      verdictEl.textContent = result.verdictText || result.verdict;

      if (result.verdict === "OK") {
        verdictEl.className = "result-verdict ac";
      } else if (result.verdict === "WRONG_ANSWER") {
        verdictEl.className = "result-verdict wa";
      } else if (result.verdict === "TIME_LIMIT_EXCEEDED") {
        verdictEl.className = "result-verdict tle";
      } else {
        verdictEl.className = "result-verdict";
      }

      document.getElementById("result-problem").textContent =
        `Problem ${result.problemIndex} · Contest ${result.contestId}`;
    }
  } catch {
    // Ignore storage errors
  }
}
