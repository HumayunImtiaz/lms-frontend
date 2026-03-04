import { useEffect } from "react";

type ToastProps = {
  type: "success" | "error";
  message: string;
  onClose: () => void;
  durationMs?: number;
};

export default function Toast({ type, message, onClose, durationMs = 2500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [onClose, durationMs]);

  const base =
    "fixed top-4 right-4 z-50 w-[92vw] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-md";
  const styles =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className={`${base} ${styles}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="font-medium">{message}</div>
        <button
          onClick={onClose}
          className="text-xs opacity-70 hover:opacity-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}