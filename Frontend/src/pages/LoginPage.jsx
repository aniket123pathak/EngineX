import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const isEmail = form.identifier.includes("@");
    const payload = {
      ...(isEmail ? { email: form.identifier } : { username: form.identifier }),
      password: form.password,
    };

    try {
      const res = await loginUser(payload);
      login(res.data.data?.user ?? res.data.data);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-white px-4">
      <div className="w-full max-w-md border-2 border-black bg-white p-8">
        <h1 className="mb-1 text-3xl font-black tracking-tight text-black">
          Welcome Back
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          Log in to your EngineX account.
        </p>

        {error && (
          <div className="mb-4 border-2 border-black bg-gray-100 px-4 py-3 text-sm font-medium text-black">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600 uppercase"
            >
              Email or Username
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              value={form.identifier}
              onChange={handleChange}
              placeholder="you@example.com or johndoe"
              className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600 uppercase"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer border-2 border-black bg-black py-3 text-sm font-bold tracking-wide text-white uppercase transition-shadow hover:shadow-[4px_4px_0_0_#555] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-bold text-black underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
