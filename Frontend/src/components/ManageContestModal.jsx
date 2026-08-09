import { useState } from "react";
import { removeProblemFromContest } from "../api/contestApi";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function ManageContestModal({ isOpen, onClose, contestId, problems, onUpdate }) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRemoveProblem = async (problemId) => {
    setIsLoading(true);
    try {
      await removeProblemFromContest(contestId, problemId);
      toast.success("Problem removed successfully");
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[85vh]">
        {}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b-2 border-black bg-gray-100">
          <h2 className="text-2xl font-black uppercase tracking-tight">Manage Problems</h2>
          <button
            onClick={onClose}
            className="text-black hover:bg-gray-300 p-1 border-2 border-transparent hover:border-black transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {}
          <Link
            to={`/contests/${contestId}/create-problem`}
            className="block w-full text-center border-2 border-black bg-black text-white px-4 py-4 text-sm font-bold uppercase tracking-wide transition-all hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] no-underline"
          >
            ✦ Create New Problem for Contest
          </Link>

          {}
          <div className="border-2 border-black bg-gray-50">
            <div className="border-b-2 border-black bg-gray-100 px-4 py-2">
              <h3 className="text-xs font-bold tracking-wide uppercase">
                Current Problems ({problems?.length || 0}/10)
              </h3>
            </div>
            <div className="p-3 min-h-[160px]">
              {problems && problems.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {problems.map((p, index) => (
                    <li key={p._id || index} className="flex justify-between items-center bg-white border-2 border-black p-2">
                      <span className="font-semibold text-sm truncate mr-2">{p.title}</span>
                      <button
                        onClick={() => handleRemoveProblem(p._id)}
                        disabled={isLoading}
                        className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
                        title="Remove Problem"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm font-semibold pt-2">No problems added yet.</p>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="flex justify-end gap-4 px-6 py-4 border-t-2 border-black">
          <button
            onClick={onClose}
            className="border-2 border-black bg-black text-white px-5 py-2 font-bold hover:bg-white hover:text-black transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
