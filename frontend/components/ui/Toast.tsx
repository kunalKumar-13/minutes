"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  description?: string;
}

interface ToastApi {
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="size-4 text-green-600" />,
  error: <AlertTriangle className="size-4 text-red-600" />,
  info: <Info className="size-4 text-blue-600" />,
};

const ACCENTS: Record<ToastKind, string> = {
  success: "border-l-green-500",
  error: "border-l-red-500",
  info: "border-l-blue-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  // The portal target does not exist during the server render. Mounting it on
  // the client only, after hydration, avoids a server/client tree mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string, description?: string) => {
      const id = (nextId.current += 1);
      setToasts((current) => [...current, { id, kind, message, description }]);
      // Errors linger; success messages get out of the way.
      window.setTimeout(() => dismiss(id), kind === "error" ? 6000 : 3600);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, description) => push("success", message, description),
      error: (message, description) => push("error", message, description),
      info: (message, description) => push("info", message, description),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div
            role="region"
            aria-live="polite"
            aria-label="Notifications"
            className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(384px,calc(100vw-2.5rem))] flex-col gap-2"
          >
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={cn(
                  "ff-surface pointer-events-auto flex animate-slide-in-right items-start gap-3 rounded-lg border border-l-[3px] p-3 shadow-e4",
                  ACCENTS[toast.kind],
                )}
              >
                <span className="mt-0.5 shrink-0">{ICONS[toast.kind]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{toast.message}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{toast.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
