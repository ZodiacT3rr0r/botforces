import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check if we have a real API key or just the placeholder
const isStubbed =
  !GEMINI_API_KEY ||
  GEMINI_API_KEY === "gemini-placeholder-key" ||
  GEMINI_API_KEY.startsWith("gemini-placeholder");

// Only initialize the client if we have a real key
const ai = isStubbed ? null : new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface AnalysisResult {
  performanceReport: string;
  recommendedTopics: string[];
  isStub?: boolean;
}

/**
 * Analyze a failed Codeforces submission using Gemini.
 *
 * Acts as a competitive programming coach: identifies conceptual mistakes,
 * explains why the solution failed, and recommends topics to practice.
 *
 * If no real API key is configured, returns a realistic stub response.
 */
export async function analyzeFailedSubmission(
  code: string,
  tags: string[],
  verdict: string,
  problemName: string
): Promise<AnalysisResult> {
  if (isStubbed) {
    return generateStubResponse(tags, verdict, problemName);
  }

  const systemPrompt = `You are an expert competitive programming coach with deep knowledge of algorithms, data structures, and common pitfalls in contest programming.

Your task is to analyze a failed Codeforces submission and provide actionable feedback.

You must return a JSON object with exactly two fields:
1. "performanceReport": A detailed analysis (3-5 paragraphs) covering:
   - What the code is trying to do (brief)
   - The likely conceptual mistake or bug causing the failure
   - Why this specific approach fails for certain test cases
   - How to fix it (high-level, not full code)
   - Time/space complexity analysis if relevant

2. "recommendedTopics": An array of 3-5 specific topics/techniques the student should study to improve. Be specific (e.g., "Segment Trees with Lazy Propagation" not just "Data Structures").

Return ONLY valid JSON, no markdown formatting.`;

  const userPrompt = `Problem: "${problemName}"
Tags: [${tags.join(", ")}]
Verdict: ${verdict}

Source Code:
\`\`\`
${code.slice(0, 8000)}
\`\`\`

Analyze this failed submission and provide your coaching feedback as JSON.`;

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            performanceReport: { type: Type.STRING },
            recommendedTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["performanceReport", "recommendedTopics"],
        },
      },
    });

    const content = response.text;
    if (!content) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(content) as Partial<AnalysisResult>;

    // Strictly validate runtime types of every field
    if (
      typeof parsed.performanceReport !== "string" ||
      !parsed.performanceReport.trim() ||
      !Array.isArray(parsed.recommendedTopics) ||
      !parsed.recommendedTopics.every((t) => typeof t === "string")
    ) {
      throw new Error("Invalid response shape from Gemini");
    }

    return {
      performanceReport: parsed.performanceReport,
      recommendedTopics: parsed.recommendedTopics,
      isStub: false,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    // Fall back to stub on error
    return generateStubResponse(tags, verdict, problemName);
  }
}

/**
 * Generate a realistic stub response for development without an API key.
 */
function generateStubResponse(
  tags: string[],
  verdict: string,
  problemName: string
): AnalysisResult {
  const verdictExplanations: Record<string, string> = {
    WRONG_ANSWER: `Your solution for "${problemName}" is producing incorrect output for certain test cases. This often indicates an edge case that wasn't handled, an off-by-one error, or a fundamental misunderstanding of the problem constraints.`,
    TIME_LIMIT_EXCEEDED: `Your solution for "${problemName}" is too slow for the given constraints. The current time complexity is likely not optimal enough. Consider whether there's a more efficient algorithm or data structure that could reduce the number of operations.`,
    MEMORY_LIMIT_EXCEEDED: `Your solution for "${problemName}" is using too much memory. This could be due to unnecessarily large data structures, recursive stack overflow, or storing intermediate results that could be computed on-the-fly.`,
    RUNTIME_ERROR: `Your solution for "${problemName}" crashed during execution. Common causes include array index out of bounds, division by zero, stack overflow from deep recursion, or integer overflow.`,
  };

  const topicSuggestions: Record<string, string[]> = {
    dp: ["Dynamic Programming on Trees", "Bitmask DP", "Digit DP"],
    "binary search": [
      "Binary Search on Answer",
      "Parametric Search",
      "Ternary Search",
    ],
    graphs: [
      "BFS/DFS Traversal Patterns",
      "Shortest Path Algorithms",
      "Topological Sorting",
    ],
    greedy: [
      "Exchange Arguments in Greedy",
      "Greedy Stays Ahead Proofs",
      "Activity Selection Problem",
    ],
    math: [
      "Modular Arithmetic",
      "Number Theory Fundamentals",
      "Combinatorics and Counting",
    ],
    "data structures": [
      "Segment Trees with Lazy Propagation",
      "Fenwick Trees (BIT)",
      "Sparse Tables for RMQ",
    ],
    strings: [
      "KMP Pattern Matching",
      "Z-Algorithm",
      "Suffix Arrays and LCP",
    ],
    trees: [
      "Heavy-Light Decomposition",
      "Euler Tour Technique",
      "LCA (Lowest Common Ancestor)",
    ],
    implementation: [
      "Edge Case Handling Techniques",
      "Simulation Optimization",
      "Input Parsing Patterns",
    ],
  };

  // Build performance report
  const baseExplanation =
    verdictExplanations[verdict] ||
    `Your solution for "${problemName}" received a ${verdict} verdict.`;

  const performanceReport = `${baseExplanation}

Based on the problem tags [${tags.join(", ")}], this problem likely requires a solid understanding of ${tags.slice(0, 2).join(" and ") || "algorithmic thinking"}. Review your approach and consider whether your solution correctly handles all edge cases mentioned in the problem statement.

**Recommended approach:** Start by carefully re-reading the problem constraints. Pay special attention to the input limits — they often hint at the expected time complexity. For example, N ≤ 10^5 typically suggests an O(N log N) solution, while N ≤ 10^3 might allow O(N²).

Consider writing additional test cases, especially boundary cases (minimum/maximum values, empty inputs, single elements). This is a common technique used by top competitive programmers to catch subtle bugs before submission.

*[This is a placeholder analysis. Connect your Gemini API key for real Gemini analysis.]*`;

  // Build recommended topics based on tags
  const recommended: string[] = [];
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase();
    for (const [key, topics] of Object.entries(topicSuggestions)) {
      if (normalizedTag.includes(key)) {
        recommended.push(...topics.slice(0, 2));
      }
    }
  }

  // Ensure we have at least 3 recommendations
  if (recommended.length < 3) {
    recommended.push(
      "Problem Decomposition Strategies",
      "Time Complexity Analysis",
      "Stress Testing with Brute Force"
    );
  }

  return {
    performanceReport,
    recommendedTopics: [...new Set(recommended)].slice(0, 5),
    isStub: true,
  };
}
