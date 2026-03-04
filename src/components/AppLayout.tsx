import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";

export default function AppLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { isAuthed, logout } = useAuth();
  const nav = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    nav("/login");
  };

  return (
    <div className="min-h-screen  from-slate-50 to-slate-100/70">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
                  L
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">LMS Admin</p>
                  <p className="text-xs text-slate-500">{title}</p>
                </div>
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isAuthed ? (
                <>
                  <Link
                    to="/admin"
                    className="hidden sm:inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                  >
                    Dashboard
                  </Link>

                  {/* Profile Dropdown (single logout place) */}
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => setMenuOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                    >
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        A
                      </div>
                      <span className="hidden sm:block">Admin</span>
                      <svg
                        className={`h-4 w-4 text-slate-500 transition ${
                          menuOpen ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                        <div className="mb-1 rounded-xl px-3 py-2">
                          <p className="text-sm font-semibold text-slate-900">Admin</p>
                          <p className="text-xs text-slate-500">Signed in</p>
                        </div>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <path d="M16 17l5-5-5-5" />
                            <path d="M21 12H9" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Body */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}