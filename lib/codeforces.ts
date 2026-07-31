/**
 * Codeforces API Client
 *
 * Rate limited to 1 request per 2 seconds per CF API rules.
 * All methods return typed responses matching CF API return objects.
 */

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface CFUser {
  handle: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string;
  rating: number;
  maxRank: string;
  maxRating: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar: string;
  titlePhoto: string;
}

export interface CFProblem {
  contestId?: number;
  problemsetName?: string;
  index: string;
  name: string;
  type: "PROGRAMMING" | "QUESTION";
  points?: number;
  rating?: number;
  tags: string[];
}

export interface CFProblemStatistics {
  contestId?: number;
  index: string;
  solvedCount: number;
}

export interface CFMember {
  handle: string;
  name?: string;
}

export interface CFParty {
  contestId?: number;
  members: CFMember[];
  participantType:
    | "CONTESTANT"
    | "PRACTICE"
    | "VIRTUAL"
    | "MANAGER"
    | "OUT_OF_COMPETITION";
  teamId?: number;
  teamName?: string;
  ghost: boolean;
  room?: number;
  startTimeSeconds?: number;
}

export interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: CFProblem;
  author: CFParty;
  programmingLanguage: string;
  verdict?:
    | "FAILED"
    | "OK"
    | "PARTIAL"
    | "COMPILATION_ERROR"
    | "RUNTIME_ERROR"
    | "WRONG_ANSWER"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED"
    | "IDLENESS_LIMIT_EXCEEDED"
    | "SECURITY_VIOLATED"
    | "CRASHED"
    | "INPUT_PREPARATION_CRASHED"
    | "CHALLENGED"
    | "SKIPPED"
    | "TESTING"
    | "REJECTED"
    | "SUBMITTED";
  testset: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
  points?: number;
}

export interface CFContest {
  id: number;
  name: string;
  type: "CF" | "IOI" | "ICPC";
  phase: "BEFORE" | "CODING" | "PENDING_SYSTEM_TEST" | "SYSTEM_TEST" | "FINISHED";
  frozen: boolean;
  durationSeconds: number;
  freezeDurationSeconds?: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
  preparedBy?: string;
  websiteUrl?: string;
  description?: string;
  difficulty?: number;
  kind?: string;
  icpcRegion?: string;
  country?: string;
  city?: string;
  season?: string;
}

export interface CFRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface CFRanklistRow {
  party: CFParty;
  rank: number;
  points: number;
  penalty: number;
  successfulHackCount: number;
  unsuccessfulHackCount: number;
  problemResults: CFProblemResult[];
  lastSubmissionTimeSeconds?: number;
}

export interface CFProblemResult {
  points: number;
  penalty?: number;
  rejectedAttemptCount: number;
  type: "PRELIMINARY" | "FINAL";
  bestSubmissionTimeSeconds?: number;
}

export interface CFStandings {
  contest: CFContest;
  problems: CFProblem[];
  rows: CFRanklistRow[];
}

interface CFAPIResponse<T> {
  status: "OK" | "FAILED";
  comment?: string;
  result?: T;
}

// ─── Rate Limiter ────────────────────────────────────────────────────────────

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const minInterval = 2100; // 2.1 seconds (slight buffer over CF's 2-second rule)

  if (timeSinceLastRequest < minInterval) {
    await new Promise((resolve) =>
      setTimeout(resolve, minInterval - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  return fetch(url);
}

async function cfApiCall<T>(
  method: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T> {
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    queryParams.set(key, String(value));
  }

  const queryString = queryParams.toString();
  const url = `https://codeforces.com/api/${method}${queryString ? `?${queryString}` : ""}`;

  const response = await rateLimitedFetch(url);

  if (!response.ok) {
    throw new Error(`CF API HTTP error: ${response.status} ${response.statusText}`);
  }

  const data: CFAPIResponse<T> = await response.json();

  if (data.status === "FAILED") {
    throw new Error(`CF API error: ${data.comment || "Unknown error"}`);
  }

  if (data.result === undefined) {
    throw new Error("CF API returned OK but no result");
  }

  return data.result;
}

// ─── API Methods ─────────────────────────────────────────────────────────────

/**
 * Fetch user profile information.
 * @param handle - Codeforces user handle
 */
export async function getUserInfo(handle: string): Promise<CFUser> {
  const users = await cfApiCall<CFUser[]>("user.info", { handles: handle });
  return users[0];
}

/**
 * Fetch multiple users' profile information.
 * @param handles - Array of Codeforces user handles
 */
export async function getUsersInfo(handles: string[]): Promise<CFUser[]> {
  return cfApiCall<CFUser[]>("user.info", {
    handles: handles.join(";"),
  });
}

/**
 * Fetch a user's submission history.
 * @param handle - Codeforces user handle
 * @param from - 1-based index of the first submission to return
 * @param count - Number of submissions to return
 */
export async function getUserSubmissions(
  handle: string,
  from?: number,
  count?: number
): Promise<CFSubmission[]> {
  const params: Record<string, string | number> = { handle };
  if (from !== undefined) params.from = from;
  if (count !== undefined) params.count = count;
  return cfApiCall<CFSubmission[]>("user.status", params);
}

/**
 * Fetch a user's rating history.
 * @param handle - Codeforces user handle
 */
export async function getUserRating(handle: string): Promise<CFRatingChange[]> {
  return cfApiCall<CFRatingChange[]>("user.rating", { handle });
}

/**
 * Fetch the list of all contests.
 * @param gym - If true, return gym contests; otherwise, regular contests
 */
export async function getContestList(gym?: boolean): Promise<CFContest[]> {
  const params: Record<string, string | boolean> = {};
  if (gym !== undefined) params.gym = gym;
  return cfApiCall<CFContest[]>("contest.list", params);
}

/**
 * Fetch contest standings.
 * @param contestId - Contest ID
 * @param from - 1-based index of standings row to start
 * @param count - Number of rows to return
 * @param handles - Semicolon-separated list of handles to filter
 */
export async function getContestStandings(
  contestId: number,
  from?: number,
  count?: number,
  handles?: string
): Promise<CFStandings> {
  const params: Record<string, string | number> = { contestId };
  if (from !== undefined) params.from = from;
  if (count !== undefined) params.count = count;
  if (handles !== undefined) params.handles = handles;
  return cfApiCall<CFStandings>("contest.standings", params);
}

/**
 * Fetch submissions for a specific contest.
 * @param contestId - Contest ID
 * @param handle - Optional: filter by user handle
 * @param from - 1-based index
 * @param count - Number of submissions
 */
export async function getContestStatus(
  contestId: number,
  handle?: string,
  from?: number,
  count?: number
): Promise<CFSubmission[]> {
  const params: Record<string, string | number> = { contestId };
  if (handle !== undefined) params.handle = handle;
  if (from !== undefined) params.from = from;
  if (count !== undefined) params.count = count;
  return cfApiCall<CFSubmission[]>("contest.status", params);
}

/**
 * Fetch rating changes for a contest.
 * @param contestId - Contest ID
 */
export async function getContestRatingChanges(
  contestId: number
): Promise<CFRatingChange[]> {
  return cfApiCall<CFRatingChange[]>("contest.ratingChanges", { contestId });
}

/**
 * Fetch all problems from the problemset, optionally filtered by tags.
 * @param tags - Array of tags to filter by
 */
export async function getProblems(
  tags?: string[]
): Promise<{ problems: CFProblem[]; problemStatistics: CFProblemStatistics[] }> {
  const params: Record<string, string> = {};
  if (tags && tags.length > 0) params.tags = tags.join(";");
  return cfApiCall<{
    problems: CFProblem[];
    problemStatistics: CFProblemStatistics[];
  }>("problemset.problems", params);
}
