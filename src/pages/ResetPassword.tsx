import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Toast from "../components/Toast";
import { api } from "../lib/api";

export default function ResetPassword() {
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null);
    setErr(null);

    if (!token) {
      setErr("Reset token missing in URL.");
      return;
    }

    if (!password || !confirmPassword) {
      setErr("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await api<{ ok: boolean; message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: { token, password },
      });

      setOk(res.message || "Password reset successful");

      setTimeout(() => {
        nav("/login");
      }, 1200);
    } catch (e: any) {
      setErr(e.message || "Reset password failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Reset Password">
      <div className="flex justify-center py-10">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 w-full">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
              <p className="text-sm text-slate-600 mt-1">
                Enter a new password for your account.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {!token && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Invalid reset link (token missing).
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  placeholder="Enter new password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  placeholder="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {ok && <Toast type="success" message={ok} onClose={() => setOk(null)} durationMs={2500} />}
              {err && <Toast type="error" message={err} onClose={() => setErr(null)} durationMs={3500} />}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-semibold hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="text-sm text-slate-600 flex items-center justify-end">
                <Link className="font-semibold text-slate-900 hover:underline" to="/login">
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}