import { useState } from "react";
import { registerContest } from "../api/contestApi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function JoinContestModal({ isOpen, onClose, contest }) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen || !contest) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerContest(contest._id, { password });
      toast.success("Successfully joined the contest!");
      onClose();
      navigate(`/contests/${contest._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join contest");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight">Join Private Contest</h2>
          <button
            onClick={onClose}
            className="text-black hover:bg-gray-200 p-1 border-2 border-transparent hover:border-black transition-colors"
          >
            ✕
          </button>
        </div>
        
        <p className="mb-4 font-semibold">
          Contest: <span className="font-bold">{contest.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm">Room Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>
          
          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="border-2 border-black bg-white px-4 py-2 font-bold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="border-2 border-black bg-black text-white px-4 py-2 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {isLoading ? "Joining..." : "Join Contest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
