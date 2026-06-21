import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { getProblemById } from "../api/problemApi";
import { submitCode } from "../api/submissionApi";

/* ─────────────────────────────────────────────
   Difficulty badge — matches rest of the app
   ───────────────────────────────────────────── */
const DIFFICULTY_STYLES = {
  EASY: "border-gray-400 text-gray-600 bg-white",
  MEDIUM: "border-gray-700 text-gray-800 bg-gray-100",
  HARD: "border-black text-white bg-black",
};

function DifficultyBadge({ difficulty }) {
  const key = difficulty?.toUpperCase() || "EASY";
  const styles = DIFFICULTY_STYLES[key] || DIFFICULTY_STYLES.EASY;
  return (
    <span
      className={`inline-block border-2 px-3 py-0.5 text-xs font-bold tracking-wide uppercase ${styles}`}
    >
      {difficulty}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Verdict color mapping (light-mode optimised)
   ───────────────────────────────────────────── */
const VERDICT_COLORS = {
  ACCEPTED: "text-green-700",
  WRONG_ANSWER: "text-red-600",
  RUNTIME_ERROR: "text-purple-700",
  SYSTEM_ERROR: "text-black",
  TIME_LIMIT_EXCEEDED: "text-red-600",
  MEMORY_LIMIT_EXCEEDED: "text-red-600",
  COMPILATION_ERROR: "text-purple-700",
};

function getVerdictColor(verdict) {
  return VERDICT_COLORS[verdict] || "text-black";
}

/* ─────────────────────────────────────────────
   Default boilerplate
   ───────────────────────────────────────────── */
const DEFAULT_CODE = `# Write your solution here
def solve():
    pass

solve()
`;

/* ═════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════ */
export default function SolveProblemPage() {
  const { id } = useParams();

  /* ── Data fetching state ── */
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  /* ── Editor & execution state ── */
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language] = useState("python");
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");

  /* ── Fetch problem on mount ── */
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await getProblemById(id);
        setProblem(res.data.data);
      } catch (err) {
        setFetchError(
          err.response?.data?.message || "Failed to load problem."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  /* ── Submit handler ── */
  const handleSubmit = async () => {
    setIsExecuting(true);
    setResult(null);
    setSubmitError("");

    try {
      const res = await submitCode({
        problemId: id,
        language,
        code,
      });
      setResult(res.data.data);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Submission failed. Please try again."
      );
    } finally {
      setIsExecuting(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <div className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
          Loading workspace…
        </div>
      </div>
    );
  }

  /* ── Fetch error ── */
  if (fetchError) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="border-2 border-black bg-gray-100 px-5 py-4 text-sm font-medium text-black">
          {fetchError}
        </div>
        <Link
          to="/dashboard"
          className="mt-4 inline-block text-sm font-bold text-black underline"
        >
          ← Back to Problems
        </Link>
      </div>
    );
  }

  /* ═════════════════════════════════════════
     MAIN WORKSPACE LAYOUT
     ═════════════════════════════════════════ */
  return (
    <div className="flex h-[calc(100vh-65px)] flex-col lg:flex-row">
      {/* ─────────────────────────────────────
          LEFT COLUMN — Problem Details
         ───────────────────────────────────── */}
      <aside className="w-full overflow-y-auto border-b-2 border-black bg-white lg:w-[45%] lg:border-r-2 lg:border-b-0">
        <div className="p-6">
          {/* Breadcrumb */}
          <Link
            to={`/problems/${id}`}
            className="mb-5 inline-block text-xs font-semibold tracking-wide text-gray-400 uppercase transition-colors hover:text-black"
          >
            ← Problem Detail
          </Link>

          {/* ── Problem Header ── */}
          <div className="mb-6 border-2 border-black p-5">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-black tracking-tight text-black">
                {problem.title}
              </h1>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>

            {/* Constraints bar */}
            <div className="flex gap-6 text-xs text-gray-500">
              <div>
                <span className="font-bold tracking-wide text-gray-700 uppercase">
                  Time Limit
                </span>{" "}
                <span className="ml-1 font-mono">{problem.timeLimit} ms</span>
              </div>
              <div>
                <span className="font-bold tracking-wide text-gray-700 uppercase">
                  Memory Limit
                </span>{" "}
                <span className="ml-1 font-mono">
                  {problem.memoryLimit} MB
                </span>
              </div>
            </div>
          </div>

          {/* ── Description ── */}
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
              Description
            </h2>
            <div className="border-l-4 border-black pl-5 text-sm leading-relaxed text-gray-800 whitespace-pre-line">
              {problem.description}
            </div>
          </div>

          {/* ── Sample Test Cases ── */}
          {problem.testCases && problem.testCases.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                Sample Test Cases
              </h2>
              <div className="space-y-4">
                {problem.testCases.map((tc, i) => (
                  <div key={i} className="border-2 border-black">
                    {/* Test case header */}
                    <div className="border-b-2 border-black bg-black px-4 py-2 text-xs font-bold tracking-wider text-white uppercase">
                      Test Case {i + 1}
                    </div>
                    <div className="grid grid-cols-1">
                      {/* Input */}
                      <div className="border-b border-gray-200 p-4">
                        <div className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                          Input
                        </div>
                        <pre className="overflow-x-auto border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-black">
                          {tc.input}
                        </pre>
                      </div>
                      {/* Expected Output */}
                      <div className="p-4">
                        <div className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                          Expected Output
                        </div>
                        <pre className="overflow-x-auto border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-black">
                          {tc.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─────────────────────────────────────
          RIGHT COLUMN — Execution Area
         ───────────────────────────────────── */}
      <main className="flex w-full flex-col bg-white lg:w-[55%]">
        {/* ── Language indicator bar ── */}
        <div className="flex items-center justify-between border-b-2 border-black bg-white px-5 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Language
            </span>
            <span className="border-2 border-black bg-black px-3 py-0.5 text-xs font-bold tracking-wide text-white uppercase">
              Python
            </span>
          </div>
          <span className="font-mono text-xs text-gray-400">
            {code.split("\n").length} lines
          </span>
        </div>

        {/* ── Code Editor (≈70%) ── */}
        <div className="flex-[7] border-b-2 border-black">
          <Editor
            height="100%"
            language={language}
            theme="light"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              lineNumbersMinChars: 3,
              renderLineHighlight: "all",
              bracketPairColorization: { enabled: false },
              wordWrap: "on",
              tabSize: 4,
              automaticLayout: true,
            }}
          />
        </div>

        {/* ── Submit Button ── */}
        <div className="border-b-2 border-black bg-white px-5 py-3">
          <button
            id="submit-code-btn"
            onClick={handleSubmit}
            disabled={isExecuting}
            className={`w-full cursor-pointer border-2 border-black px-6 py-3 text-sm font-black tracking-widest uppercase transition-all ${
              isExecuting
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "bg-black text-white hover:bg-white hover:text-black"
            }`}
          >
            {isExecuting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                EXECUTING...
              </span>
            ) : (
              "SUBMIT CODE"
            )}
          </button>
        </div>

        {/* ── Terminal / Console Output (≈30%) ── */}
        <div className="flex flex-[3] flex-col overflow-y-auto border-t-0 bg-gray-50">
          {/* Terminal header */}
          <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-5 py-2">
            <span className="text-xs font-black tracking-widest text-black uppercase">
              Terminal
            </span>
            <span className="text-xs text-gray-400">— Output</span>
            {result && (
              <button
                onClick={() => {
                  setResult(null);
                  setSubmitError("");
                }}
                className="ml-auto cursor-pointer text-xs font-bold text-gray-400 transition-colors hover:text-black"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Terminal body */}
          <div className="flex-1 overflow-y-auto p-5 font-mono text-sm">
            {/* Empty state */}
            {!result && !submitError && !isExecuting && (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs font-semibold tracking-wide text-gray-300 uppercase">
                  Submit your code to see results here
                </p>
              </div>
            )}

            {/* Executing state */}
            {isExecuting && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase animate-pulse">
                    Evaluating your submission…
                  </div>
                  <div className="mx-auto h-1 w-32 overflow-hidden bg-gray-200">
                    <div className="h-full w-full origin-left animate-pulse bg-black" />
                  </div>
                </div>
              </div>
            )}

            {/* Error from submission */}
            {submitError && (
              <div className="border-2 border-black bg-gray-100 p-4">
                <div className="mb-1 text-xs font-bold tracking-wider text-red-600 uppercase">
                  Error
                </div>
                <p className="text-sm text-black">{submitError}</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-4">
                {/* Verdict banner */}
                <div className="border-2 border-black p-4">
                  <div className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Verdict
                  </div>
                  <div
                    className={`text-2xl font-black tracking-tight uppercase ${getVerdictColor(
                      result.verdict
                    )}`}
                  >
                    {result.verdict?.replace(/_/g, " ")}
                  </div>
                </div>

                {/* Test cases passed */}
                {result.testCasesPassed !== undefined && (
                  <div className="border-2 border-black p-4">
                    <div className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                      Test Cases Passed
                    </div>
                    <div className="font-mono text-lg font-black text-black">
                      {result.testCasesPassed}
                      {problem.testCases && (
                        <span className="text-gray-400">
                          {" "}
                          / {problem.testCases.length}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Detailed results per test case */}
                {result.details && result.details.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                      Details
                    </div>
                    <div className="space-y-2">
                      {result.details.map((detail, i) => (
                        <div
                          key={i}
                          className="border border-gray-200 bg-white p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500">
                              Test Case {i + 1}
                            </span>
                            <span
                              className={`text-xs font-black uppercase ${getVerdictColor(
                                detail.verdict || detail.status
                              )}`}
                            >
                              {(detail.verdict || detail.status)?.replace(
                                /_/g,
                                " "
                              )}
                            </span>
                          </div>
                          {detail.stdout && (
                            <div className="mt-2">
                              <div className="mb-1 text-xs text-gray-400">
                                stdout
                              </div>
                              <pre className="overflow-x-auto border border-gray-200 bg-gray-50 p-2 text-xs text-black">
                                {detail.stdout}
                              </pre>
                            </div>
                          )}
                          {detail.stderr && (
                            <div className="mt-2">
                              <div className="mb-1 text-xs text-gray-400">
                                stderr
                              </div>
                              <pre className="overflow-x-auto border border-gray-200 bg-gray-50 p-2 text-xs text-red-600">
                                {detail.stderr}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
