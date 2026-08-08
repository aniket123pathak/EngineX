import { useState } from "react";
import { Link } from "react-router-dom";
import { createProblem } from "../api/problemApi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const EMPTY_TEST_CASE = { input: "", expectedOutput: "", isHidden: false };

export default function CreateProblemPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "EASY",
    timeLimit: 1000,
    memoryLimit: 256,
  });

  const [isPrivate, setIsPrivate] = useState(!isAdmin);
  const [testCases, setTestCases] = useState([{ ...EMPTY_TEST_CASE }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdProblemId, setCreatedProblemId] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setTestCases((prev) =>
      prev.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      )
    );
  };

  const addTestCase = () => {
    setTestCases((prev) => [...prev, { ...EMPTY_TEST_CASE }]);
  };

  const removeTestCase = (index) => {
    if (testCases.length <= 1) return;
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      ...form,
      isPrivate: isAdmin ? isPrivate : true,
      testCases: testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
      })),
    };

    try {
      const res = await createProblem(payload);
      const newId = res.data?.data?._id;
      setCreatedProblemId(newId);
      toast.success("Problem created successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = async () => {
    if (!createdProblemId) return;
    try {
      await navigator.clipboard.writeText(createdProblemId);
      setCopied(true);
      toast.success("Problem ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy — please select and copy manually.");
    }
  };

  const handleCreateAnother = () => {
    setCreatedProblemId(null);
    setCopied(false);
    setError("");
    setForm({
      title: "",
      description: "",
      difficulty: "EASY",
      timeLimit: 1000,
      memoryLimit: 256,
    });
    setIsPrivate(!isAdmin);
    setTestCases([{ ...EMPTY_TEST_CASE }]);
  };

  // ─────────────────────────────────────────────
  //  SUCCESS RECEIPT
  // ─────────────────────────────────────────────
  if (createdProblemId) {
    return (
      <div className="mx-auto min-h-[calc(100vh-65px)] max-w-2xl px-6 py-16 flex flex-col items-center justify-center">
        <div className="w-full border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Success header bar */}
          <div className="border-b-2 border-black bg-black px-6 py-5">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              ✓ Problem Created Successfully
            </h1>
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Instruction */}
            <p className="text-sm font-semibold text-gray-700 leading-relaxed">
              Copy this unique Problem ID. You will need to paste it into your{" "}
              <strong className="text-black">Manage Contest</strong> dashboard
              to add this problem to a contest.
            </p>

            {/* Problem ID display */}
            <div className="border-2 border-black">
              <div className="border-b-2 border-black bg-gray-100 px-4 py-2">
                <span className="text-xs font-bold tracking-wide text-gray-600 uppercase">
                  Problem ID
                </span>
              </div>
              <div className="flex items-center gap-3 p-4">
                <code className="flex-1 bg-gray-100 border-2 border-gray-300 px-4 py-3 font-mono text-sm font-bold text-black select-all break-all">
                  {createdProblemId}
                </code>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className={`shrink-0 border-2 border-black px-4 py-3 text-xs font-bold uppercase tracking-wide transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    copied
                      ? "bg-green-200 text-green-900 border-green-800"
                      : "bg-black text-white hover:bg-white hover:text-black"
                  }`}
                >
                  {copied ? "✓ Copied!" : "Copy ID"}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 border-t-2 border-black pt-6">
              <button
                type="button"
                onClick={handleCreateAnother}
                className="flex-1 border-2 border-black bg-white px-5 py-3 text-sm font-bold text-black uppercase tracking-wide transition-all hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                + Create Another Problem
              </button>
              <Link
                to="/contests"
                className="flex-1 border-2 border-black bg-black px-5 py-3 text-center text-sm font-bold text-white uppercase tracking-wide no-underline transition-all hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Go to Contests →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  //  CREATION FORM
  // ─────────────────────────────────────────────
  return (
    <div className="mx-auto min-h-[calc(100vh-65px)] max-w-3xl px-6 py-10">
      <Link
        to="/dashboard"
        className="mb-6 inline-block text-sm font-semibold text-gray-500 transition-colors hover:text-black"
      >
        ← Back to Dashboard
      </Link>

      <div className="mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-black tracking-tight text-black">
          Create New Problem
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details and add test cases.
        </p>
      </div>

      {error && (
        <div className="mb-6 border-2 border-black bg-gray-100 px-5 py-4 text-sm font-medium text-black">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600 uppercase"
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Two Sum"
            className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600 uppercase"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the problem statement, constraints, and examples…"
            className="w-full resize-y border-2 border-black bg-white px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="difficulty"
              className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600 uppercase"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm text-black outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
            >
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="timeLimit"
              className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600 uppercase"
            >
              Time Limit (ms)
            </label>
            <input
              id="timeLimit"
              name="timeLimit"
              type="number"
              required
              min={100}
              value={form.timeLimit}
              onChange={handleChange}
              className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm text-black outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
            />
          </div>

          <div>
            <label
              htmlFor="memoryLimit"
              className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600 uppercase"
            >
              Memory Limit (MB)
            </label>
            <input
              id="memoryLimit"
              name="memoryLimit"
              type="number"
              required
              min={16}
              value={form.memoryLimit}
              onChange={handleChange}
              className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm text-black outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
            />
          </div>
        </div>

        {/* ─── Visibility / Privacy ─── */}
        <div className="border-2 border-black">
          <div className="border-b-2 border-black bg-gray-100 px-4 py-2">
            <span className="text-xs font-bold tracking-wide text-black uppercase">
              Visibility
            </span>
          </div>
          <div className="px-4 py-4">
            <label
              htmlFor="isPrivate"
              className={`flex items-center gap-3 ${
                isAdmin ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            >
              <input
                id="isPrivate"
                type="checkbox"
                checked={isAdmin ? isPrivate : true}
                disabled={!isAdmin}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 accent-black disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span className="text-sm font-bold text-black">
                Make Private (Hide from Global Pool)
              </span>
            </label>
            {!isAdmin && (
              <p className="mt-2 border-l-4 border-black pl-3 text-xs font-medium text-gray-500">
                As a standard user, custom problems are strictly private and can
                only be used in your own contests.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wider text-gray-600 uppercase">
              Test Cases ({testCases.length})
            </h2>
            <button
              type="button"
              onClick={addTestCase}
              className="cursor-pointer border-2 border-black bg-white px-3 py-1 text-xs font-bold text-black transition-colors hover:bg-black hover:text-white"
            >
              + Add Another Test Case
            </button>
          </div>

          <div className="space-y-4">
            {testCases.map((tc, index) => (
              <div key={index} className="border-2 border-black">
                <div className="flex items-center justify-between border-b-2 border-black bg-gray-100 px-4 py-2">
                  <span className="text-xs font-bold tracking-wide text-black uppercase">
                    Test Case {index + 1}
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-gray-600">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) =>
                          handleTestCaseChange(index, "isHidden", e.target.checked)
                        }
                        className="h-3.5 w-3.5 cursor-pointer accent-black"
                      />
                      Hidden
                    </label>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        className="cursor-pointer text-xs font-bold text-gray-400 transition-colors hover:text-black"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="border-b border-gray-200 p-4 md:border-r md:border-b-0">
                    <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-500 uppercase">
                      Input
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={tc.input}
                      onChange={(e) =>
                        handleTestCaseChange(index, "input", e.target.value)
                      }
                      placeholder={"e.g. 5\n1 2 3 4 5"}
                      className="w-full resize-y border-2 border-gray-300 bg-white px-3 py-2 font-mono text-sm text-black placeholder-gray-400 outline-none transition-shadow focus:border-black focus:shadow-[3px_3px_0_0_#000]"
                    />
                  </div>
                  <div className="p-4">
                    <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-500 uppercase">
                      Expected Output
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={tc.expectedOutput}
                      onChange={(e) =>
                        handleTestCaseChange(index, "expectedOutput", e.target.value)
                      }
                      placeholder="e.g. 15"
                      className="w-full resize-y border-2 border-gray-300 bg-white px-3 py-2 font-mono text-sm text-black placeholder-gray-400 outline-none transition-shadow focus:border-black focus:shadow-[3px_3px_0_0_#000]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t-2 border-black pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer border-2 border-black bg-black py-3 text-sm font-bold tracking-wide text-white uppercase transition-shadow hover:shadow-[4px_4px_0_0_#555] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating Problem…" : "Create Problem"}
          </button>
        </div>
      </form>
    </div>
  );
}
