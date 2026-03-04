import AppLayout from "../components/AppLayout";

export default function SubuserDashboard() {
  return (
    <AppLayout title="Subuser Dashboard">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-slate-900">Welcome Sub-user</h1>
        <p className="text-sm text-slate-600 mt-1">
          You are logged in as SUBUSER.
        </p>
      </div>
    </AppLayout>
  );
}