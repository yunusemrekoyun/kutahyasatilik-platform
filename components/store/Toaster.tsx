"use client";

import { useStore } from "./StoreProvider";

export default function Toaster() {
  const { toasts } = useStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            t.type === "error" ? "bg-red-600" : t.type === "info" ? "bg-slate-800" : "bg-brand-700"
          }`}
        >
          <span>{t.type === "error" ? "⚠️" : t.type === "info" ? "ℹ️" : "✓"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
