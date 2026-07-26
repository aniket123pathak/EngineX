import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUserProfile } from "../api/userApi";
import { useAuth } from "../context/AuthContext";

export default function UserProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfile();
        setProfile(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-gray-50">
        <div className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
          Loading profile…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto min-h-[calc(100vh-65px)] max-w-5xl px-6 py-10 bg-gray-50">
        <div className="border-2 border-black bg-white px-5 py-4 text-sm font-medium text-black">
          {error}
        </div>
        <Link
          to="/dashboard"
          className="mt-4 inline-block text-sm font-bold text-black underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const { user: profileUser, stats, recentSubmissions } = profile;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50 py-10 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">
              {profileUser.username}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{profileUser.email}</p>
          </div>
          <div className="bg-white px-6 py-4 shadow-sm border border-gray-200 text-center rounded-sm">
            <div className="text-3xl font-black text-gray-900">{stats.totalSolved}</div>
            <div className="text-xs font-bold tracking-wide text-gray-500 uppercase mt-1">
              Total Problems Solved
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-4">
          Recent Submissions
        </h2>
        
        {recentSubmissions && recentSubmissions.length > 0 ? (
          <div className="overflow-hidden border border-gray-200 bg-white shadow-sm rounded-sm">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  <th className="px-5 py-3 text-xs font-bold tracking-wider uppercase">Date / Time</th>
                  <th className="px-5 py-3 text-xs font-bold tracking-wider uppercase">Problem</th>
                  <th className="px-5 py-3 text-xs font-bold tracking-wider uppercase">Language</th>
                  <th className="px-5 py-3 text-xs font-bold tracking-wider uppercase">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((sub, idx) => {
                  let verdictColor = "text-gray-600";
                  if (sub.status === "ACCEPTED") verdictColor = "text-green-600";
                  else if (["WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", "RUNTIME_ERROR", "COMPILATION_ERROR"].includes(sub.status)) verdictColor = "text-red-600";
                  else if (sub.status === "PENDING") verdictColor = "text-gray-400";

                  return (
                    <tr key={sub._id} className={`border-b border-gray-200 transition-colors hover:bg-gray-50 ${idx === recentSubmissions.length - 1 ? "border-b-0" : ""}`}>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                        {new Date(sub.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {sub.problem?.title || "Unknown Problem"}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-600 uppercase">
                        {sub.language}
                      </td>
                      <td className={`px-5 py-4 font-bold tracking-wide uppercase ${verdictColor}`}>
                        {sub.status?.replace(/_/g, ' ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 py-16 text-center bg-white shadow-sm rounded-sm">
            <p className="text-lg font-bold text-gray-400">No recent submissions</p>
            <p className="mt-1 text-sm text-gray-400">
              Start solving problems to see your history here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
