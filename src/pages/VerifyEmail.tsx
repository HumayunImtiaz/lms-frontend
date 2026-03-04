import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useEffect, useRef, useState } from "react";
import AppLayout from "../components/AppLayout";


type VerifyRes = { message?: string };

export default function VerifyEmail() {
  const [sp] = useSearchParams();
  const token = sp.get("token");

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const didRun = useRef(false);
  
  useEffect(() => {

     if (didRun.current) return;   
  didRun.current = true;

    const run = async () => {
      if (!token) {
        setErr("Token missing in URL.");
        setLoading(false);
        return;
      }

      try {
        const res = await api<VerifyRes>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        setOk(res?.message || "Email verified successfully. You can login now.");
      } catch (e: any) {
        setErr(e.message || "Verification failed");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  return (

     <AppLayout title="Verify Email">
    <div className="flex justify-center py-10">
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900">Verify Email</h1>
        <p className="text-sm text-slate-600 mt-1">
          Verifying your account...
        </p>

        <div className="mt-5">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Please wait...
            </div>
          )}

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          {ok && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {ok}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            to="/login"
            className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold hover:bg-slate-800"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>

     </div>
  </AppLayout>
  );
}