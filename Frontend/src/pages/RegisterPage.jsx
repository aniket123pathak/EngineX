import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await registerUser(form);
      setSuccess(res.data.message || "Registration successful. Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-white px-4">
      <div className="w-full max-w-md border-2 border-black bg-white p-8">
        {/* Header */}
        <h1 className="mb-1 text-3xl font-black tracking-tight text-black">
          Create Account
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          Join EngineX and start solving.
        </p>

        {/* Error / Success banners */}
        {error && (
          <div className="mb-4 border-2 border-black bg-gray-100 px-4 py-3 text-sm font-medium text-black">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 border-2 border-black bg-black px-4 py-3 text-sm font-medium text-white">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600 uppercase"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. johndoe"
              className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600 uppercase"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
            />
          </div>

          {/* Password */}
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
              placeholder="Min. 6 characters"
              className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none transition-shadow focus:shadow-[4px_4px_0_0_#000]"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer border-2 border-black bg-black py-3 text-sm font-bold tracking-wide text-white uppercase transition-shadow hover:shadow-[4px_4px_0_0_#555] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-black underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
