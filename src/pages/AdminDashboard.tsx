import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import Toast from "../components/Toast";
import AppLayout from "../components/AppLayout";

type Invite = {
  _id: string;
  email: string;
  inviteType: "INTERNAL" | "EXTERNAL";
  status: "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  usedAt?: string | null;
  cancelledAt?: string | null;
};

type ListInvitesRes = { ok: boolean; count: number; invites: Invite[] };

type Subuser = {
  _id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "DELETED" | "PENDING_VERIFY";
  lastLoginAt?: string | null;
  createdAt: string;
};

type ListSubusersRes = { ok: boolean; count: number; subusers: Subuser[] };

type CreateInviteRes = {
  ok: boolean;
  message: string;
  inviteId: string;
  expiresAt: string;
  inviteLink?: string | null; // dev only
};

type CreateInviteFieldErrors = {
  email?: string;
};

const STATUS_OPTIONS = ["ALL", "PENDING", "ACCEPTED", "CANCELLED", "EXPIRED"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

function SectionCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DELETED: "bg-rose-50 text-rose-700 border-rose-200",
    PENDING_VERIFY: "bg-amber-50 text-amber-700 border-amber-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
    EXPIRED: "bg-rose-50 text-rose-700 border-rose-200",
    INTERNAL: "bg-indigo-50 text-indigo-700 border-indigo-200",
    EXTERNAL: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        map[value] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {value}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "default",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "dark";
  type?: "button" | "submit";
}) {
  const styles =
    variant === "danger"
      ? "border-red-200 text-red-700 hover:bg-red-50"
      : variant === "dark"
      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
      : "border-slate-300 text-slate-700 hover:bg-slate-50";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${styles} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const nav = useNavigate();

  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const [subStatus, setSubStatus] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [subusers, setSubusers] = useState<Subuser[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [email, setEmail] = useState("");
  const [inviteType, setInviteType] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL");
  const [creating, setCreating] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  // ✅ Inline field errors for Create Invite form
  const [inviteFieldErrors, setInviteFieldErrors] = useState<CreateInviteFieldErrors>({});

  const fetchInvites = async (s: StatusFilter) => {
    if (!token) return;
    setErr(null);
    setLoadingInvites(true);
    try {
      const res = await api<ListInvitesRes>(`/api/invites?status=${s}`, { token });
      setInvites(res.invites || []);
    } catch (e: any) {
      setErr(e.message || "Failed to load invites");
    } finally {
      setLoadingInvites(false);
    }
  };

  const fetchSubusers = async (s: "ALL" | "ACTIVE" | "DELETED") => {
    if (!token) return;
    setErr(null);
    setLoadingSubs(true);
    try {
      const res = await api<ListSubusersRes>(`/api/admin/subusers?status=${s}`, { token });
      setSubusers(res.subusers || []);
    } catch (e: any) {
      setErr(e.message || "Failed to load subusers");
    } finally {
      setLoadingSubs(false);
    }
  };

  const softDeleteSubuser = async (subuserId: string) => {
    if (!token) return;
    if (!confirm("Soft delete this sub-user?")) return;
    setErr(null);
    setOk(null);
    try {
      await api(`/api/admin/subusers/${subuserId}`, { method: "DELETE", token });
      setOk("Sub-user deleted (soft)");
      await fetchSubusers(subStatus);
    } catch (e: any) {
      setErr(e.message || "Delete failed");
    }
  };

  const restoreSubuser = async (subuserId: string) => {
    if (!token) return;
    setErr(null);
    setOk(null);
    try {
      await api(`/api/admin/subusers/${subuserId}/restore`, { method: "PATCH", token });
      setOk("Sub-user restored");
      await fetchSubusers(subStatus);
    } catch (e: any) {
      setErr(e.message || "Restore failed");
    }
  };

  const permanentDeleteSubuser = async (subuserId: string) => {
    if (!token) return;
    if (!confirm("Permanent delete? This cannot be undone.")) return;
    setErr(null);
    setOk(null);
    try {
      await api(`/api/admin/subusers/${subuserId}/permanent`, { method: "DELETE", token });
      setOk("Sub-user permanently deleted");
      await fetchSubusers(subStatus);
    } catch (e: any) {
      setErr(e.message || "Permanent delete failed");
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      try {
        await api("/api/auth/admin-check", { token });
      } catch {
        logout();
        nav("/login");
      }
    };
    run();
  }, [token, logout, nav]);

  useEffect(() => {
    fetchInvites(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  useEffect(() => {
    fetchSubusers(subStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subStatus, token]);

  const onCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setErr(null);
    setOk(null);
    setDevLink(null);
    setInviteFieldErrors({});

    // ✅ Frontend empty check (login jaisa inline error)
    if (!email.trim()) {
      setInviteFieldErrors({ email: "Email is required" });
      return;
    }

    setCreating(true);

    try {
      const res = await api<CreateInviteRes>("/api/invites", {
        method: "POST",
        token,
        body: { email: email.trim(), inviteType },
      });

      setOk(res.message || "Invite created");
      if (res.inviteLink) setDevLink(res.inviteLink);

      setEmail("");
      setInviteFieldErrors({});
      await fetchInvites(status);
    } catch (e: any) {
      const apiErrors = e?.data?.errors;

      // ✅ Backend Zod field errors -> inline show
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const nextFieldErrors: CreateInviteFieldErrors = {};

        for (const item of apiErrors) {
          const field = String(item?.field || ""); // e.g. body.email
          const message = String(item?.message || "Invalid input");

          if (field === "body.email") nextFieldErrors.email = message;
        }

        setInviteFieldErrors(nextFieldErrors);
        setErr(null); // validation errors ke liye toast nahi
      } else {
        // ✅ Business/general/server errors -> toast
        setErr(e?.message || "Failed to create invite");
      }
    } finally {
      setCreating(false);
    }
  };

  const cancelInvite = async (id: string) => {
    if (!token) return;
    setErr(null);
    setOk(null);
    try {
      await api(`/api/invites/${id}/cancel`, { method: "PATCH", token });
      setOk("Invite cancelled");
      await fetchInvites(status);
    } catch (e: any) {
      setErr(e.message || "Cancel failed");
    }
  };

  const resendInvite = async (id: string) => {
    if (!token) return;
    setErr(null);
    setOk(null);
    setDevLink(null);
    try {
      const res: any = await api(`/api/invites/${id}/resend`, { method: "PATCH", token });
      setOk("Invite resent (new token generated)");
      if (res?.inviteLink) setDevLink(res.inviteLink);
      await fetchInvites(status);
    } catch (e: any) {
      setErr(e.message || "Resend failed");
    }
  };

  const deleteInvite = async (id: string) => {
    if (!token) return;
    if (!confirm("Delete this invite?")) return;
    setErr(null);
    setOk(null);
    try {
      await api(`/api/invites/${id}`, { method: "DELETE", token });
      setOk("Invite deleted");
      await fetchInvites(status);
    } catch (e: any) {
      setErr(e.message || "Delete failed");
    }
  };

  const deleteMyAdminAccount = async () => {
    if (!token) return;
    if (
      !confirm(
        "Delete your admin account? This will also delete all related sub-users (soft delete)."
      )
    )
      return;

    setErr(null);
    setOk(null);

    try {
      const res: any = await api("/api/admin/me", { method: "DELETE", token });
      setOk(res?.message || "Admin deleted");
      logout();
      nav("/login");
    } catch (e: any) {
      setErr(e.message || "Admin delete failed");
    }
  };

  const permanentDeleteMyAdminAccount = async () => {
    if (!token) return;
    if (
      !confirm(
        "PERMANENT delete your admin account and all related sub-users? This cannot be undone."
      )
    )
      return;

    setErr(null);
    setOk(null);

    try {
      const res: any = await api("/api/admin/me/permanent", { method: "DELETE", token });
      setOk(res?.message || "Admin permanently deleted");
      logout();
      nav("/login");
    } catch (e: any) {
      setErr(e.message || "Permanent admin delete failed");
    }
  };

  const fmt = (d?: string | null) => {
    if (!d) return "-";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "-" : dt.toLocaleString();
  };

  const stats = useMemo(() => {
    const totalSubusers = subusers.length;
    const activeSubusers = subusers.filter((u) => u.status === "ACTIVE").length;
    const deletedSubusers = subusers.filter((u) => u.status === "DELETED").length;
    const pendingInvites = invites.filter((i) => i.status === "PENDING").length;
    const acceptedInvites = invites.filter((i) => i.status === "ACCEPTED").length;

    return {
      totalSubusers,
      activeSubusers,
      deletedSubusers,
      pendingInvites,
      acceptedInvites,
    };
  }, [subusers, invites]);

  return (
    <AppLayout title="Admin Dashboard">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Admin Panel • System Ready
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">
                Create invites, manage sub-users, and control access in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ActionButton onClick={deleteMyAdminAccount}>Delete My Account</ActionButton>
              <ActionButton onClick={permanentDeleteMyAdminAccount} variant="danger">
                Permanent Delete
              </ActionButton>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Sub-users
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalSubusers}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Active Users
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.activeSubusers}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Deleted Users
              </p>
              <p className="mt-2 text-2xl font-bold text-rose-700">{stats.deletedSubusers}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Pending Invites
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-700">{stats.pendingInvites}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Accepted Invites
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.acceptedInvites}</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-2">
          {err && <Toast type="error" message={err} onClose={() => setErr(null)} durationMs={3500} />}
          {ok && <Toast type="success" message={ok} onClose={() => setOk(null)} durationMs={2500} />}

          {devLink && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Dev Invite Link</p>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  Development Only
                </span>
              </div>

              <div className="space-y-3">
                <a
                  className="block break-all rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800 underline"
                  href={devLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  {devLink}
                </a>

                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(devLink);
                        setOk("Link copied!");
                      } catch {
                        setErr("Copy failed (browser blocked).");
                      }
                    }}
                  >
                    Copy
                  </ActionButton>

                  <a
                    className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    href={devLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Invite */}
        <SectionCard title="Create Invite" subtitle="Generate an invite for sub-user onboarding.">
          <form onSubmit={onCreateInvite} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-slate-900/10 ${
                  inviteFieldErrors.email
                    ? "border-red-400 focus:border-red-400"
                    : "border-slate-300 focus:border-slate-400"
                }`}
                placeholder="subuser@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setInviteFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                autoComplete="email"
              />
              {inviteFieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{inviteFieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Invite Type</label>
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                value={inviteType}
                onChange={(e) => setInviteType(e.target.value as "INTERNAL" | "EXTERNAL")}
              >
                <option value="INTERNAL">INTERNAL</option>
                <option value="EXTERNAL">EXTERNAL</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Invite"}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* Sub-users */}
        <SectionCard
          title="Sub-users"
          subtitle="View, restore, or delete sub-user accounts."
          right={
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
              value={subStatus}
              onChange={(e) => setSubStatus(e.target.value as "ALL" | "ACTIVE" | "DELETED")}
            >
              <option value="ALL">ALL</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DELETED">DELETED</option>
            </select>
          }
        >
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Last Login</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {loadingSubs ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={6}>
                        Loading sub-users...
                      </td>
                    </tr>
                  ) : subusers.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={6}>
                        No sub-users found.
                      </td>
                    </tr>
                  ) : (
                    subusers.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {u.name || <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{u.email}</td>
                        <td className="px-4 py-3">
                          <StatusBadge value={u.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">{fmt(u.lastLoginAt || null)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton
                              onClick={() => softDeleteSubuser(u._id)}
                              disabled={u.status !== "ACTIVE"}
                            >
                              Delete
                            </ActionButton>

                            <ActionButton
                              onClick={() => restoreSubuser(u._id)}
                              disabled={u.status !== "DELETED"}
                            >
                              Restore
                            </ActionButton>

                            <ActionButton
                              onClick={() => permanentDeleteSubuser(u._id)}
                              variant="danger"
                            >
                              Permanent
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

        {/* Invites */}
        <SectionCard
          title="Invites"
          subtitle="Track invite status and manage invite actions."
          right={
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          }
        >
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Expires</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {loadingInvites ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={6}>
                        Loading invites...
                      </td>
                    </tr>
                  ) : invites.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={6}>
                        No invites found.
                      </td>
                    </tr>
                  ) : (
                    invites.map((i) => (
                      <tr key={i._id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-medium text-slate-900">{i.email}</td>
                        <td className="px-4 py-3">
                          <StatusBadge value={i.inviteType} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={i.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">{fmt(i.expiresAt)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(i.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton
                              onClick={() => cancelInvite(i._id)}
                              disabled={i.status !== "PENDING"}
                            >
                              Cancel
                            </ActionButton>

                            <ActionButton
                              onClick={() => resendInvite(i._id)}
                              disabled={i.status !== "PENDING"}
                            >
                              Resend
                            </ActionButton>

                            <ActionButton onClick={() => deleteInvite(i._id)} variant="danger">
                              Delete
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppLayout>
  );
}