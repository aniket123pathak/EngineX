import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-white px-4">
      <div className="w-full max-w-lg border-2 border-black bg-white p-10 text-center">
        <h1 className="mb-2 text-4xl font-black tracking-tight text-black">
          Welcome to EngineX
        </h1>
        <p className="mb-6 text-gray-500">Dashboard</p>

        {user && (
          <div className="inline-block border-2 border-black bg-gray-50 px-6 py-3 text-sm">
            Logged in as{" "}
            <span className="font-bold text-black">
              {user.username || user.email}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
