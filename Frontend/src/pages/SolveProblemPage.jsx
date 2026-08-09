import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { getProblemById } from "../api/problemApi";
import { submitCode, getSubmissionById, runCode } from "../api/submissionApi";
import toast from "react-hot-toast";

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

const VERDICT_CONFIG = {
  ACCEPTED: {
    text: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-300",
    icon: "✓",
  },
  WRONG_ANSWER: {
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-300",
    icon: "✗",
  },
  RUNTIME_ERROR: {
    text: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-300",
    icon: "⚠",
  },
  SYSTEM_ERROR: {
    text: "text-gray-700",
    bg: "bg-gray-100",
    border: "border-gray-300",
    icon: "⊘",
  },
  TIME_LIMIT_EXCEEDED: {
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-300",
    icon: "⏱",
  },
  MEMORY_LIMIT_EXCEEDED: {
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-300",
    icon: "⊗",
  },
  COMPILATION_ERROR: {
    text: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-300",
    icon: "⚙",
  },
};

const DEFAULT_VERDICT_CONFIG = {
  text: "text-gray-700",
  bg: "bg-gray-100",
  border: "border-gray-300",
  icon: "?",
};

function getVerdictConfig(verdict) {
  return VERDICT_CONFIG[verdict] || DEFAULT_VERDICT_CONFIG;
}

function getVerdictColor(verdict) {
  return getVerdictConfig(verdict).text;
}

const POLL_INTERVAL_MS = 1200;

const BOILERPLATES = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    return 0;
}
`,
  python: `def solve():
    pass

solve()
`,
  javascript: `function solve() {

}

solve();
`,
};

const LANGUAGE_OPTIONS = [
  { value: "cpp", label: "C++ (GCC 11)" },
  { value: "python", label: "Python (3.9)" },
  { value: "javascript", label: "Node.js (18)" },
];

const MONACO_LANG_MAP = {
  cpp: "cpp",
  python: "python",
  javascript: "javascript",
};

export default function SolveProblemPage() {
  const { id } = useParams();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(BOILERPLATES["cpp"]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const [submissionId, setSubmissionId] = useState(null);
  const [pollingStatus, setPollingStatus] = useState(null);
  const pollIntervalRef = useRef(null);
  const pollCountRef = useRef(0);

  const [activeTab, setActiveTab] = useState("TESTCASES");
  const [customInput, setCustomInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState("");

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await getProblemById(id);
        const problemData = res.data.data;
        setProblem(problemData);
        if (problemData.testCases && problemData.testCases.length > 0) {
          setCustomInput(problemData.testCases[0].input || "");
        }
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

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleRun = async () => {
    let payloadInput = customInput;

    if (!payloadInput.trim()) {
      if (problem?.testCases && problem.testCases.length > 0) {
        payloadInput = problem.testCases[0].input;
        setCustomInput(payloadInput);
        toast.success("Running against Sample Test Case 1");
      } else {
        toast.error("Please provide custom input to run your code.");
        return;
      }
    }

    stopPolling();
    setIsRunning(true);
    setRunResult(null);
    setRunError("");
    setResult(null);
    setSubmitError("");
    setActiveTab("OUTPUT");

    try {
      const res = await runCode({
        problemId: id,
        language,
        code,
        customInput: payloadInput
      });
      setRunResult(res.data.data);
    } catch (err) {
      setRunError(
        err.response?.data?.message || "Run failed. Please try again."
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    stopPolling();
    setIsExecuting(true);
    setResult(null);
    setSubmitError("");
    setRunResult(null);
    setRunError("");
    setSubmissionId(null);
    setPollingStatus("PENDING");
    setActiveTab("OUTPUT");
    pollCountRef.current = 0;

    try {
      const res = await submitCode({
        problemId: id,
        language,
        code,
      });

      const newSubmissionId = res.data.data.submissionId;
      setSubmissionId(newSubmissionId);

      pollIntervalRef.current = setInterval(async () => {
        try {
          pollCountRef.current += 1;
          const pollRes = await getSubmissionById(newSubmissionId);
          const submission = pollRes.data.data;

          if (submission.status !== "PENDING") {
            stopPolling();
            setResult(submission);
            setPollingStatus(null);
            setIsExecuting(false);
          } else {
            setPollingStatus("PENDING");
          }
        } catch (pollErr) {
          stopPolling();
          setSubmitError("Lost connection while checking results. Please try again.");
          setPollingStatus(null);
          setIsExecuting(false);
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Submission failed. Please try again."
      );
      setPollingStatus(null);
      setIsExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <div className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
          Loading workspace…
        </div>
      </div>
    );
  }

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

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col lg:flex-row">
      <aside className="w-full overflow-y-auto border-b-2 border-black bg-white lg:w-[45%] lg:border-r-2 lg:border-b-0">
        <div className="p-6">
          <Link
            to={`/problems/${id}`}
            className="mb-5 inline-block text-xs font-semibold tracking-wide text-gray-400 uppercase transition-colors hover:text-black"
          >
            ← Problem Detail
          </Link>

          <div className="mb-6 border-2 border-black p-5">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-black tracking-tight text-black">
                {problem.title}
              </h1>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>

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

          <div className="mb-6">
            <h2 className="mb-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
              Description
            </h2>
            <div className="border-l-4 border-black pl-5 text-sm leading-relaxed text-gray-800 whitespace-pre-line">
              {problem.description}
            </div>
          </div>

          {problem.testCases && problem.testCases.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                Sample Test Cases
              </h2>
              <div className="space-y-4">
                {problem.testCases.map((tc, i) => (
                  <div key={i} className="border-2 border-black">
                    <div className="border-b-2 border-black bg-black px-4 py-2 text-xs font-bold tracking-wider text-white uppercase">
                      Test Case {i + 1}
                    </div>
                    <div className="grid grid-cols-1">
                      <div className="border-b border-gray-200 p-4">
                        <div className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                          Input
                        </div>
                        <pre className="overflow-x-auto border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-black">
                          {tc.input}
                        </pre>
                      </div>
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

      <main className="flex w-full flex-col bg-white lg:w-[55%]">
        <div className="flex items-center justify-between border-b-2 border-black bg-white px-5 py-2.5">
          <div className="flex items-center gap-3">
            <label
              htmlFor="language-select"
              className="text-xs font-bold tracking-wider text-gray-400 uppercase"
            >
              Language
            </label>
            <div className="relative">
              <select
                id="language-select"
                value={language}
                onChange={(e) => {
                  const next = e.target.value;
                  setLanguage(next);
                  setCode(BOILERPLATES[next]);
                }}
                className="cursor-pointer appearance-none border-2 border-black bg-white py-1 pr-8 pl-3 font-mono text-xs font-bold text-black outline-none transition-colors hover:bg-gray-100"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-black"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M2 4l4 4 4-4z" />
              </svg>
            </div>
          </div>
          <span className="font-mono text-xs text-gray-400">
            {code.split("\n").length} lines
          </span>
        </div>

        <div className="flex-[7] border-b-2 border-black">
          <Editor
            height="100%"
            language={MONACO_LANG_MAP[language]}
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

        <div className="flex gap-4 border-b-2 border-black bg-white px-5 py-3">
          <button
            onClick={handleRun}
            disabled={isExecuting || isRunning}
            className={`flex-1 cursor-pointer border-2 border-gray-300 px-6 py-3 text-sm font-black tracking-widest uppercase transition-all ${
              isRunning || isExecuting
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "bg-white text-gray-800 hover:border-black hover:bg-gray-50"
            }`}
          >
            {isRunning ? "RUNNING..." : "RUN CODE"}
          </button>

          <button
            id="submit-code-btn"
            onClick={handleSubmit}
            disabled={isExecuting || isRunning}
            className={`flex-1 cursor-pointer border-2 border-black px-6 py-3 text-sm font-black tracking-widest uppercase transition-all ${
              isExecuting || isRunning
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

        <div className="flex flex-[3] flex-col overflow-y-auto border-t-0 bg-gray-50">
          <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-5 pt-2">
            <button
              onClick={() => setActiveTab("TESTCASES")}
              className={`pb-2 text-xs font-black tracking-widest uppercase transition-colors ${
                activeTab === "TESTCASES"
                  ? "border-b-2 border-black text-black"
                  : "border-b-2 border-transparent text-gray-400 hover:text-black"
              }`}
            >
              Testcases
            </button>
            <button
              onClick={() => setActiveTab("OUTPUT")}
              className={`pb-2 text-xs font-black tracking-widest uppercase transition-colors ${
                activeTab === "OUTPUT"
                  ? "border-b-2 border-black text-black"
                  : "border-b-2 border-transparent text-gray-400 hover:text-black"
              }`}
            >
              Output
            </button>
            
            {isExecuting && pollingStatus === "PENDING" && (
              <span className="ml-2 mb-2 inline-flex items-center gap-1.5 border-2 border-black bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-black uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-40" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-black" />
                </span>
                Polling
              </span>
            )}
            
            {(result || submitError || runResult || runError) && (
              <button
                onClick={() => {
                  setResult(null);
                  setSubmitError("");
                  setRunResult(null);
                  setRunError("");
                }}
                className="ml-auto mb-2 cursor-pointer text-xs font-bold text-gray-400 transition-colors hover:text-black"
              >
                CLEAR
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-sm">
            {activeTab === "TESTCASES" ? (
              <div className="h-full p-4">
                <div className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                  Custom Input
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="h-[calc(100%-24px)] w-full resize-none border-2 border-gray-200 bg-white p-3 font-mono text-sm text-black outline-none focus:border-black transition-colors"
                  placeholder="Enter custom input here..."
                />
              </div>
            ) : (
              <div className="h-full p-5">
                {!result && !submitError && !isExecuting && !runResult && !runError && !isRunning && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-10 w-10 border-2 border-gray-200 bg-white flex items-center justify-center">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold tracking-wide text-gray-300 uppercase">
                        Run or submit your code to see results here
                      </p>
                    </div>
                  </div>
                )}
                
                {isRunning && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center space-y-4">
                      <svg className="mx-auto h-8 w-8 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      <div className="text-sm font-bold tracking-widest text-black uppercase">Running Code…</div>
                    </div>
                  </div>
                )}

                {runError && (
                  <div className="border-2 border-black bg-gray-100 p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wider text-red-600 uppercase">
                      <span>⚠</span> Error
                    </div>
                    <p className="text-sm text-black">{runError}</p>
                  </div>
                )}

                {runResult && (() => {
                  let isDefaultInput = false;
                  let isMatch = false;
                  const defaultTestcase = problem.testCases?.[0];
                  
                  if (defaultTestcase) {
                    const defaultInput = defaultTestcase.input || "";
                    if (customInput.trim() === defaultInput.trim()) {
                      isDefaultInput = true;
                      isMatch = runResult.output?.trim() === defaultTestcase.expectedOutput?.trim();
                    }
                  }

                  let verdictText = runResult.status;
                  let verdictColor = "text-red-600";
                  
                  if (runResult.status === "SUCCESS") {
                    if (isDefaultInput) {
                      if (isMatch) {
                        verdictText = "Accepted";
                        verdictColor = "text-green-600";
                      } else {
                        verdictText = "Wrong Answer";
                        verdictColor = "text-red-600";
                      }
                    } else {
                      verdictText = "Execution Successful";
                      verdictColor = "text-gray-500";
                    }
                  }

                  return (
                    <div className="space-y-4 animate-[fadeIn_0.4s_ease-out]">
                      <div className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                        Run Result
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`text-xl font-black tracking-tight uppercase ${verdictColor}`}>
                          {verdictText.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                            Your Output
                          </div>
                          <pre className={`overflow-x-auto border-2 border-gray-200 bg-white p-4 text-sm ${runResult.status === "SUCCESS" ? "text-gray-900" : "text-red-600"}`}>
                            {runResult.output || "No output"}
                          </pre>
                        </div>

                        {runResult.status === "SUCCESS" && isDefaultInput && (
                          <div className="flex-1">
                            <div className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                              Expected Output
                            </div>
                            <pre className="overflow-x-auto border-2 border-gray-200 bg-white p-4 text-sm text-gray-900">
                              {defaultTestcase.expectedOutput}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

            {isExecuting && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="relative mx-auto h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-black" style={{ animationDuration: '1.2s' }} />
                    <div className="absolute inset-1.5 animate-spin rounded-full border-2 border-transparent border-b-gray-400" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-3 rounded-full border border-gray-200" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-black animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-bold tracking-widest text-black uppercase">
                      Judging Your Code
                    </div>
                    <div className="text-xs text-gray-500 tracking-wide">
                      {pollingStatus === "PENDING"
                        ? `Waiting for verdict · Poll #${pollCountRef.current}`
                        : "Submitting to judge…"}
                    </div>
                  </div>

                  <div className="mx-auto max-w-xs space-y-2">
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" style={{ animationDuration: '1.5s' }} />
                    </div>
                    <div className="h-2 w-3/4 mx-auto rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                    </div>
                    <div className="h-2 w-1/2 mx-auto rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0.6s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {submitError && (
              <div className="border-2 border-black bg-gray-100 p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wider text-red-600 uppercase">
                  <span>⚠</span> Error
                </div>
                <p className="text-sm text-black">{submitError}</p>
              </div>
            )}

            {result && (() => {
              const verdict = result.verdict || result.status;
              const vc = getVerdictConfig(verdict);
              return (
                <div className="space-y-4 animate-[fadeIn_0.4s_ease-out]">
                  <div className={`border-2 p-5 ${vc.border} ${vc.bg}`}>
                    <div className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                      Verdict
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-3xl ${vc.text}`}>{vc.icon}</span>
                      <span className={`text-2xl font-black tracking-tight uppercase ${vc.text}`}>
                        {verdict?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

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

                  {result.details && result.details.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                        Details
                      </div>
                      <div className="space-y-2">
                        {result.details.map((detail, i) => {
                          const dVerdict = detail.verdict || detail.status;
                          const dvc = getVerdictConfig(dVerdict);
                          return (
                            <div
                              key={i}
                              className="border border-gray-200 bg-white p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500">
                                  Test Case {i + 1}
                                </span>
                                <span className={`flex items-center gap-1.5 text-xs font-black uppercase ${dvc.text}`}>
                                  <span className="text-sm">{dvc.icon}</span>
                                  {dVerdict?.replace(/_/g, " ")}
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
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
