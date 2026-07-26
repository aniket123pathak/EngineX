import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProblemById } from "../api/problemApi";

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

export default function ProblemDetailPage() {
  const { id } = useParams();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await getProblemById(id);
        setProblem(res.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load problem."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <div className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
          Loading problem…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="border-2 border-black bg-gray-100 px-5 py-4 text-sm font-medium text-black">
          {error}
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
    <div className="mx-auto min-h-[calc(100vh-65px)] max-w-4xl px-6 py-10">
      <Link
        to="/dashboard"
        className="mb-6 inline-block text-sm font-semibold text-gray-500 transition-colors hover:text-black"
      >
        ← Back to Problems
      </Link>

      <div className="mb-8 border-2 border-black p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight text-black">
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
            <span className="ml-1 font-mono">{problem.memoryLimit} MB</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
          Description
        </h2>
        <div className="border-l-4 border-black pl-5 text-sm leading-relaxed text-gray-800 whitespace-pre-line">
          {problem.description}
        </div>
      </div>

      {problem.testCases && problem.testCases.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
            Sample Test Cases
          </h2>
          <div className="space-y-4">
            {problem.testCases.map((tc, i) => (
              <div key={i} className="border-2 border-black">
                <div className="border-b-2 border-black bg-black px-4 py-2 text-xs font-bold tracking-wider text-white uppercase">
                  Test Case {i + 1}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="border-b border-gray-200 p-4 md:border-r md:border-b-0">
                    <div className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                      Input
                    </div>
                    <pre className="overflow-x-auto bg-gray-50 p-3 font-mono text-sm text-black">
                      {tc.input}
                    </pre>
                  </div>
                  <div className="p-4">
                    <div className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                      Expected Output
                    </div>
                    <pre className="overflow-x-auto bg-gray-50 p-3 font-mono text-sm text-black">
                      {tc.expectedOutput}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-2 border-black bg-white px-6 py-8 text-center">
        <Link
          to={`/problems/${id}/solve`}
          className="inline-block border-2 border-black bg-black px-8 py-3 text-sm font-black tracking-widest text-white uppercase transition-all hover:bg-white hover:text-black"
        >
          Open Workspace →
        </Link>
        <p className="mt-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
          Launch the code editor &amp; submit your solution
        </p>
      </div>
    </div>
  );
}
