import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getContestById, registerContest } from "../api/contestApi";
import { useAuth } from "../context/AuthContext";
import ManageContestModal from "../components/ManageContestModal";
import toast from "react-hot-toast";

export default function ContestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // ─── Password gate state ───
  const [roomPassword, setRoomPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const fetchContest = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await getContestById(id);
      setContest(data.data);
      setIsLocked(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setIsLocked(true);
      } else {
        toast.error(err.response?.data?.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContest();
  }, [fetchContest]);

  useEffect(() => {
    if (!contest) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const startTime = new Date(contest.startTime);
      const difference = startTime - now;

      if (difference > 0) {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft("");
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  // ─── Unlock handler ───
  const handleUnlock = async (e) => {
    e.preventDefault();
    setIsJoining(true);
    try {
      await registerContest(id, { password: roomPassword });
      toast.success("Successfully joined the contest!");
      setRoomPassword("");
      setIsLocked(false);
      fetchContest();
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  
  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-bold text-gray-500">Loading contest arena...</p>
      </div>
    );
  }

  
  if (isLocked) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <Link
          to="/contests"
          className="mb-8 inline-block text-sm font-bold text-gray-500 transition-colors hover:text-black"
        >
          ← Back to Contests
        </Link>

        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {}
          <div className="border-b-2 border-black bg-gray-100 px-6 py-4">
            <h1 className="text-2xl font-black uppercase tracking-tight">
              🔒 Private Contest
            </h1>
          </div>

          <div className="p-6">
            <p className="mb-6 font-semibold text-gray-700">
              This contest requires a room password to enter. Get the password
              from the contest author and enter it below.
            </p>

            <form onSubmit={handleUnlock} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="roomPassword"
                  className="text-xs font-bold tracking-wide text-gray-600 uppercase"
                >
                  Room Password
                </label>
                <input
                  id="roomPassword"
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Enter the room password"
                  className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Link
                  to="/contests"
                  className="border-2 border-black bg-white px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-gray-100 no-underline"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="border-2 border-black bg-black px-5 py-2 text-sm font-bold text-white transition-all hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {isJoining ? "Unlocking…" : "Unlock & Join"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  
  if (!contest) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="border-2 border-black p-8 text-center bg-gray-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-bold text-red-600 text-xl">Contest not found</p>
        </div>
      </div>
    );
  }

  const isAuthor = contest.isAuthor === true || (user && user._id === contest.author?._id);
  const hasStarted = new Date(contest.startTime) <= new Date();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {}
      <div className="border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10 relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-2">{contest.name}</h1>
            <p className="text-gray-700 font-semibold max-w-2xl">{contest.description}</p>
          </div>
          {isAuthor && (
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="border-2 border-black bg-black text-white px-6 py-2 font-bold hover:bg-white hover:text-black transition-colors"
            >
              Manage Contest
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-gray-200 pt-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Start Time</span>
            <span className="font-semibold text-lg">{new Date(contest.startTime).toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">End Time</span>
            <span className="font-semibold text-lg">{new Date(contest.endTime).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {}
      {!hasStarted && (
        <div className="border-2 border-black bg-yellow-100 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-10 text-center">
          <h2 className="text-xl font-black uppercase mb-2 text-yellow-900">Contest Starts In</h2>
          <p className="text-4xl font-black tabular-nums tracking-wider text-black">{timeLeft}</p>
        </div>
      )}

      {}
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Problems</h2>
        
        {(!hasStarted && !isAuthor) ? (
          <div className="border-2 border-black border-dashed p-12 text-center bg-gray-50">
            <p className="font-bold text-gray-500 text-lg">Problems will be revealed when the contest starts. Stay tuned!</p>
          </div>
        ) : contest.problems && contest.problems.length > 0 ? (
          <div className="flex flex-col gap-4">
            {contest.problems.map((problem, idx) => (
              <Link
                key={problem._id || idx}
                to={`/problems/${problem._id}/solve`}
                className="group border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center"
              >
                <div>
                  <h3 className="text-xl font-black uppercase group-hover:underline">{problem.title}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`border-2 border-black px-3 py-1 text-sm font-bold capitalize ${
                    problem.difficulty === 'easy' ? 'bg-green-200' :
                    problem.difficulty === 'medium' ? 'bg-yellow-200' :
                    'bg-red-200'
                  }`}>
                    {problem.difficulty || 'Unknown'}
                  </span>
                  <span className="text-black font-black text-2xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-2 border-black p-8 text-center bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-bold text-gray-500">No problems have been added to this contest yet.</p>
          </div>
        )}
      </div>

      <ManageContestModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        contestId={contest._id}
        problems={contest.problems}
        onUpdate={fetchContest}
      />
    </div>
  );
}
