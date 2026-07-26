import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllProblems, deleteProblem } from "../api/problemApi";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

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

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteProblem(deleteTarget._id);
    setProblems((prev) => prev.filter((p) => p._id !== deleteTarget._id));
    setDeleteTarget(null);
  };

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await getAllProblems();
        setProblems(res.data.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load problems."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  return (
    <div className="mx-auto min-h-[calc(100vh-65px)] max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-black">
            Problem Pool
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Pick a problem and start solving.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === "ADMIN" && (
            <button
              onClick={() => navigate("/admin/problems/create")}
              className="cursor-pointer border-2 border-black bg-black px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white hover:text-black"
            >
              + Create New Problem
            </button>
          )}
          {user && (
            <div className="text-sm text-gray-500">
              Logged in as{" "}
              <span className="font-bold text-black">
                {user.username || user.email}
              </span>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
            Loading problems…
          </div>
        </div>
      )}

      {error && (
        <div className="border-2 border-black bg-gray-100 px-5 py-4 text-sm font-medium text-black">
          {error}
        </div>
      )}

      {!loading && !error && problems.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 py-16 text-center">
          <p className="text-lg font-bold text-gray-400">No problems yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Check back later or ask an admin to add problems.
          </p>
        </div>
      )}

      {!loading && !error && problems.length > 0 && (
        <div className="border-2 border-black">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black bg-black text-white">
                <th className="px-5 py-3 text-left text-xs font-bold tracking-wider uppercase">
                  #
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold tracking-wider uppercase">
                  Title
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold tracking-wider uppercase">
                  Difficulty
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold tracking-wider uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem, index) => (
                <tr
                  key={problem._id}
                  className={`border-b border-gray-200 transition-colors hover:bg-gray-50 ${
                    index === problems.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-mono text-xs text-gray-400">
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-4 font-semibold text-black">
                    {problem.title}
                  </td>
                  <td className="px-5 py-4">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/problems/${problem._id}`)}
                        className="cursor-pointer border-2 border-black bg-white px-4 py-1.5 text-xs font-bold tracking-wide text-black uppercase transition-all hover:bg-black hover:text-white"
                      >
                        Solve →
                      </button>
                      {user?.role === "ADMIN" && (
                        <button
                          id={`delete-btn-${problem._id}`}
                          onClick={() => setDeleteTarget(problem)}
                          className="cursor-pointer border-2 border-black bg-white px-4 py-1.5 text-xs font-bold tracking-wide text-black uppercase transition-all hover:border-red-700 hover:bg-red-700 hover:text-white"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          problemTitle={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
