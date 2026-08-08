import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getContests } from "../api/contestApi";
import CreateContestModal from "../components/CreateContestModal";
import toast from "react-hot-toast";

export default function ContestsPage() {
  const [contests, setContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchContests = async () => {
    setIsLoading(true);
    try {
      const { data } = await getContests();
      setContests(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black uppercase tracking-tight">Contests</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="border-2 border-black bg-black text-white px-6 py-2 font-bold hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          Create Contest
        </button>
      </div>

      {isLoading ? (
        <p className="font-bold text-gray-500">Loading contests...</p>
      ) : contests.length === 0 ? (
        <div className="border-2 border-black p-8 text-center bg-gray-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-bold text-gray-600">No contests available right now. Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((contest) => (
            <Link
              key={contest._id}
              to={`/contests/${contest._id}`}
              className="group border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col no-underline text-inherit"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-black uppercase line-clamp-2">{contest.name}</h2>
                {contest.visibility === "PRIVATE" ? (
                  <span className="flex items-center gap-1 border-2 border-gray-600 bg-gray-200 text-gray-800 text-xs font-bold px-2 py-1 ml-2 shrink-0">
                    🔒 PRIVATE
                  </span>
                ) : (
                  <span className="border-2 border-green-600 bg-green-200 text-green-900 text-xs font-bold px-2 py-1 ml-2 shrink-0">
                    PUBLIC
                  </span>
                )}
              </div>
              
              <div className="mt-auto pt-4 border-t-2 border-gray-200 flex flex-col gap-2">
                <p className="text-sm font-semibold">
                  <span className="text-gray-500">Author:</span> {contest.author?.username || "Unknown"}
                </p>
                <div className="text-sm font-semibold text-gray-600">
                  <p>Start: {new Date(contest.startTime).toLocaleString()}</p>
                  <p>End: {new Date(contest.endTime).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateContestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchContests}
      />
    </div>
  );
}
