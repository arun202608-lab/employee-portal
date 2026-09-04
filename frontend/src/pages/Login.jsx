import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import api from "../services/api";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.location.assign("/dashboard");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fa] p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_70px_rgba(15,23,42,0.10)]">

        {/* Left branding section */}
        <section className="relative hidden w-1/2 overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 font-bold">
                EP
              </div>

              <span className="text-lg font-semibold tracking-tight text-white">
                Employee Portal
              </span>
            </div>

            <div className="mt-24 max-w-md">
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                Workspace
              </p>

              <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white">
                Everything your team needs,
                <span className="text-slate-400"> in one place.</span>
              </h1>

              <p className="mt-6 max-w-sm text-base leading-7 text-slate-400">
                Securely manage employees, roles, permissions and connected
                business services from one workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>© 2026 Employee Portal</span>
            <span>Secure workspace</span>
          </div>
        </section>

        {/* Login section */}
        <section className="flex w-full items-center justify-center px-6 py-12 sm:px-12 lg:w-1/2">
          <div className="w-full max-w-md">

            <div className="mb-10">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <LockKeyhole size={22} className="text-slate-700" />
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to continue to your workspace.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                />
                Keep me signed in
              </label>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Access is controlled by your assigned role and permissions.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;