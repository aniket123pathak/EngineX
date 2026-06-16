import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="border-b-2 border-black bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-black tracking-tight text-black uppercase">
          EngineX
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-gray-700 transition-colors hover:text-black"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="cursor-pointer border-2 border-black bg-white px-4 py-1.5 text-sm font-bold text-black transition-colors hover:bg-black hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-700 transition-colors hover:text-black"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="border-2 border-black bg-black px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white hover:text-black"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
