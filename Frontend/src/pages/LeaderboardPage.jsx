import React, { useState, useEffect } from "react";
import { getLeaderboard } from "../api/userApi";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await getLeaderboard();
        setLeaderboard(response.data.data);
      } catch (err) {
        setError(err.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-center text-4xl font-bold tracking-tight text-gray-900">
          Global Leaderboard
        </h1>

        {loading && (
          <p className="text-center text-gray-500 font-medium">Loading...</p>
        )}
        
        {error && (
          <p className="text-center text-red-500 font-medium">{error}</p>
        )}

        {!loading && !error && leaderboard.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg text-gray-600 font-medium">
              No users have solved any problems yet. Be the first!
            </p>
          </div>
        )}

        {!loading && !error && leaderboard.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Rank
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Problems Solved
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {leaderboard.map((user, index) => {
                  const rank = index + 1;
                  let rankColor = "text-gray-900";
                  let rankIcon = null;

                  if (rank === 1) {
                    rankColor = "text-yellow-500 font-bold";
                    rankIcon = "🏆";
                  } else if (rank === 2) {
                    rankColor = "text-gray-400 font-bold";
                    rankIcon = "🥈";
                  } else if (rank === 3) {
                    rankColor = "text-amber-600 font-bold";
                    rankIcon = "🥉";
                  }

                  return (
                    <tr
                      key={user.userId}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <span className={rankColor}>
                          {rankIcon && (
                            <span className="mr-2">{rankIcon}</span>
                          )}
                          #{rank}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        {user.totalSolved}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
