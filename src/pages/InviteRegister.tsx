import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import Toast from "../components/Toast";
import AppLayout from "../components/AppLayout";

type InviteVerifyRes = {
  message?: string;
  email?: string;
  inviteType?: string;
};

type SubuserRegisterRes = {
  message?: string;
  ok?: boolean;
  status?: "success" | "error";
  statusCode?: number;
};

type InviteRegisterFieldErrors = {
  name?: string;
  password?: string;
  token?: string;
};

export default function InviteRegister() {
  const nav = useNavigate();
  const didVerify = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [sp] = useSearchParams();
  const token = sp.get("token");

  const [loading, setLoading] = useState(true);
  const [inviteOk, setInviteOk] = useState(false);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // server/general errors (toast)
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // inline validation errors
  const [fieldErrors, setFieldErrors] = useState<InviteRegisterFieldErrors>({});

  useEffect(() => {
    if (didVerify.current) return;
    didVerify.current = true;

    const run = async () => {
      setErr(null);
      setOk(null);

      if (!token) {
        setErr("Token missing in URL.");
        setLoading(false);
        return;
      }

      try {
        const res = await api<InviteVerifyRes>(
          `/api/invites/verify?token=${encodeURIComponent(token)}`
        );
        setInviteOk(true);
        setInviteEmail(res.email || null);
      } catch (e: any) {
        setErr(e?.message || "Invite verification failed");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setFieldErrors({});

    if (!token) {
      setErr("Token missing in URL.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api<SubuserRegisterRes>("/api/auth/register-subuser", {
        method: "POST",
        body: { token, name, password },
      });

      setRegistered(true);
      setOk(res?.message || "Sub-user created. Please verify your email, then login.");
      setName("");
      setPassword("");
      setFieldErrors({});
    } catch (e: any) {
      const apiErrors = e?.data?.errors;

      // ✅ Zod validation errors -> inline
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const nextFieldErrors: InviteRegisterFieldErrors = {};

        for (const item of apiErrors) {
          const field = String(item?.field || "");
          const message = String(item?.message || "Invalid input");

          if (field === "body.name") nextFieldErrors.name = message;
          if (field === "body.password") nextFieldErrors.password = message;
          if (field === "body.token") nextFieldErrors.token = message;
        }

        setFieldErrors(nextFieldErrors);

        // token validation usually URL issue hota hai -> toast me dikhana better
        if (nextFieldErrors.token) {
          setErr(nextFieldErrors.token);
        } else {
          setErr(null);
        }
      } else {
        // business/server errors -> toast
        setErr(e?.message || "Sub-user registration failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Invite Registration">
      <div className="flex justify-center py-10">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-slate-900">Invite Registration</h1>
            <p className="text-sm text-slate-600 mt-1">
              Register your sub-user account using invite token.
            </p>

            <div className="mt-5">
              {loading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Verifying invite...
                </div>
              )}

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
            </div>

            {inviteOk && !loading && !registered && (
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                {inviteEmail && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    Invite for: <span className="font-semibold">{inviteEmail}</span>
                  </div>
                )}

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
                    placeholder="Sub User Name"
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-semibold hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create Sub-user"}
                </button>

                <div className="text-sm text-slate-600 flex items-center justify-between">
                  <span>Already have credentials?</span>
                  <Link className="font-semibold text-slate-900 hover:underline" to="/login">
                    Login
                  </Link>
                </div>
              </form>
            )}

            {registered && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => nav("/login")}
                  className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold hover:bg-slate-800"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}