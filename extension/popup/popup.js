/**
 * BotForces Extension — Popup Script
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Show version
  const manifest = chrome.runtime.getManifest();
  document.getElementById("version").textContent = `v${manifest.version}`;

  // Check Codeforces login status
  checkCodeforcesLogin();

  // Check BotForces app connectivity
  checkAppConnection();

  // Check for last submission result
  checkLastResult();
});

async function checkCodeforcesLogin() {
  const dot = document.getElementById("cf-status-dot");
  const text = document.getElementById("cf-status-text");

  try {
    const cookies = await chrome.cookies.getAll({ domain: "codeforces.com" });
    const isLoggedIn = cookies.some(c => c.name === "X-User" || c.name === "RC" || c.name === "X-User-Sha1");

    if (isLoggedIn) {
      dot.className = "status-dot connected";
      text.textContent = "Logged into Codeforces";
    } else {
      dot.className = "status-dot disconnected";
      text.textContent = "Not logged into Codeforces";
    }
  } catch (error) {
    dot.className = "status-dot disconnected";
    text.textContent = "Cannot check CF login";
  }
}

async function checkAppConnection() {
  const dot = document.getElementById("app-status-dot");
  const text = document.getElementById("app-status-text");

  try {
    const response = await fetch("http://localhost:3000/api/contests", {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok || response.status === 405) {
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
      // Show if less than 1 hour old
      container.style.display = "block";

      const verdictEl = document.getElementById("result-verdict");
      verdictEl.textContent = result.verdictText || result.verdict;

      // Color-code the verdict
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
