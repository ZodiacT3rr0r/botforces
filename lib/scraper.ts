import * as cheerio from "cheerio";

/**
 * Scrape the source code of a Codeforces submission.
 *
 * Fetches the submission page and extracts the text content from
 * the <pre id="program-source-text"> element.
 *
 * @param contestId - The contest ID
 * @param submissionId - The submission ID
 * @returns The source code as a string, or null if extraction fails
 */
export async function scrapeSourceCode(
  contestId: number,
  submissionId: number
): Promise<string | null> {
  try {
    const url = `https://codeforces.com/contest/${contestId}/submission/${submissionId}`;

    const response = await fetch(url, {
      headers: {
        // Mimic a browser request to avoid being blocked
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      console.warn(
        `[Scraper] Could not fetch submission ${submissionId}: Codeforces returned ${response.status}. (Often blocked by Cloudflare)`
      );
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // The source code is in a <pre> element with id "program-source-text"
    const sourceElement = $("#program-source-text");

    if (sourceElement.length === 0) {
      console.warn(
        `Could not find #program-source-text for submission ${submissionId}`
      );
      return null;
    }

    // Get text content (preserves whitespace/indentation)
    const sourceCode = sourceElement.text().trim();

    if (!sourceCode) {
      console.warn(
        `Empty source code for submission ${submissionId}`
      );
      return null;
    }

    return sourceCode;
  } catch (error) {
    console.error(
      `Error scraping submission ${contestId}/${submissionId}:`,
      error
    );
    return null;
  }
}
