import { useCallback, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

// Lightweight, self-contained toast. Each page calls useToast() and renders
// the returned `toast` element once; showToast(msg) flashes a confirmation.
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);

  const showToast = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => {
      setMsg((cur) => (cur === m ? null : cur));
    }, 2000);
  }, []);

  const toast = (
    <div
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 dark:text-slate-950",
        msg ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      )}
      role="status"
      aria-live="polite"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-slate-900">
        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
      </span>
      {msg}
    </div>
  );

  return { showToast, toast };
}
