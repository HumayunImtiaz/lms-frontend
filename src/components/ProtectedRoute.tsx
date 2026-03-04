import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthed, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }

  if (!isAuthed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}