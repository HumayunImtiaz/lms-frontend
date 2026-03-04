import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import AppLayout from "../components/AppLayout";

type LoginRes = {
  token: string;
  user: { id: string; role: string; email: string; name: string };
  message?: string;
  ok?: boolean;
  statusCode?: number;
  status?: "success" | "error";
};

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export default function Login() {
  const nav = useNavigate();
  const { setToken } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // server/general errors (toast)
  const [err, setErr] = useState<string | null>(null);

  // inline validation errors
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await api<LoginRes>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

      const authToken = res.token;

      setToken(authToken);

      const me = await api<{ ok: boolean; user: { id: string; role: string } }>(
        "/api/auth/me",
        { token: authToken }
      );

      if (me.user.role === "ADMIN") nav("/admin");
      else nav("/subuser");
    } catch (e: any) {
      const apiErrors = e?.data?.errors;

      // ✅ Backend Zod field errors -> inline show
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const nextFieldErrors: LoginFieldErrors = {};

        for (const item of apiErrors) {
          const field = String(item?.field || ""); // e.g. body.email
          const message = String(item?.message || "Invalid input");

          if (field === "body.email") nextFieldErrors.email = message;
          if (field === "body.password") nextFieldErrors.password = message;
        }

        setFieldErrors(nextFieldErrors);
        setErr(null); // validation errors ke liye toast nahi
      } else {
        const msg = e?.message || "Login failed";

        // ✅ Business logic/server errors -> toast
        if (
          msg.toLowerCase().includes("pending") ||
          msg.toLowerCase().includes("verify") ||
          msg.toLowerCase().includes("not active")
        ) {
          setErr(
            "Your account is not verified yet. Please check your email and verify first, then login."
          );
        } else {
          setErr(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Login">
      <div className="flex justify-center py-10">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
              <p className="text-sm text-slate-600 mt-1">
                Sign in to manage invites & sub-users.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10 ${
                    fieldErrors.email
                      ? "border-red-400 focus:border-red-400"
                      : "border-slate-300 focus:border-slate-400"
                  }`}
                  placeholder="admin@test.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10 ${
                    fieldErrors.password
                      ? "border-red-400 focus:border-red-400"
                      : "border-slate-300 focus:border-slate-400"
                  }`}
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  autoComplete="current-password"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-slate-900 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {err && (
                <Toast
                  type="error"
                  message={err}
                  onClose={() => setErr(null)}
                  durationMs={3500}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-semibold hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="text-sm text-slate-600 flex items-center justify-between">
                <span>New admin?</span>
                <Link
                  className="font-semibold text-slate-900 hover:underline"
                  to="/register-admin"
                >
                  Register
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}