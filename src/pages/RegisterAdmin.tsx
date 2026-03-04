import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Toast from "../components/Toast";
import AppLayout from "../components/AppLayout";

type RegisterRes = {
  message?: string;
  ok?: boolean;
  status?: "success" | "error";
  statusCode?: number;
};

type RegisterFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

export default function RegisterAdmin() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null); // server/general error -> toast
  const [ok, setOk] = useState<string | null>(null);

  // ✅ inline field errors
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await api<RegisterRes>("/api/auth/register-admin", {
        method: "POST",
        body: { name, email, password },
      });

      setOk(res?.message || "Registered. Please check your email to verify.");
      setName("");
      setEmail("");
      setPassword("");
      setFieldErrors({});
    } catch (e: any) {
      const apiErrors = e?.data?.errors;

      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const nextFieldErrors: RegisterFieldErrors = {};

        for (const item of apiErrors) {
          const field = String(item?.field || "");
          const message = String(item?.message || "Invalid input");

          if (field === "body.name") nextFieldErrors.name = message;
          if (field === "body.email") nextFieldErrors.email = message;
          if (field === "body.password") nextFieldErrors.password = message;
        }

        setFieldErrors(nextFieldErrors);
        setErr(null); // validation error toast nahi dikhani
      } else {
        const msg = e?.message || "Register failed";
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Register Admin">
      <div className="flex justify-center py-10">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Register Admin</h1>
              <p className="text-sm text-slate-600 mt-1">
                Create admin account (verification email will be sent).
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10 ${
                    fieldErrors.name
                      ? "border-red-400 focus:border-red-400"
                      : "border-slate-300 focus:border-slate-400"
                  }`}
                  placeholder="Admin Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  autoComplete="name"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                )}
              </div>

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
                  autoComplete="new-password"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {err && (
                <Toast
                  type="error"
                  message={err}
                  onClose={() => setErr(null)}
                  durationMs={3500}
                />
              )}
              {ok && (
                <Toast
                  type="success"
                  message={ok}
                  onClose={() => setOk(null)}
                  durationMs={2500}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-semibold hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Admin"}
              </button>

              <div className="text-sm text-slate-600 flex items-center justify-between">
                <span>Already have an account?</span>
                <Link className="font-semibold text-slate-900 hover:underline" to="/login">
                  Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}