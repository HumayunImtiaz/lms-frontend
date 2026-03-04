import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import AppLayout from "../components/AppLayout";
import Toast from "../components/Toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null);
    setErr(null);
    setLoading(true);

    try {
      const res = await api<{ ok: boolean; message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });

      setOk(res.message || "If this email exists, a reset link will be sent.");
    } catch (e: any) {
      setErr(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Forgot Password">
      <div className="flex justify-center py-10">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 w-full">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
              <p className="text-sm text-slate-600 mt-1">
                Enter your email to receive a reset link.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  type="email"
                />
              </div>

              {ok && <Toast type="success" message={ok} onClose={() => setOk(null)} durationMs={3500} />}
              {err && <Toast type="error" message={err} onClose={() => setErr(null)} durationMs={3500} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-semibold hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
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