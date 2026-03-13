import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    className: "border-teal-300/40 bg-teal-300/15 text-teal-50",
  },
  error: {
    icon: TriangleAlert,
    className: "border-rose-300/40 bg-rose-400/15 text-rose-50",
  },
  info: {
    icon: Info,
    className: "border-white/15 bg-white/10 text-white",
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutMapRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    const timeoutId = timeoutMapRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, message, type = "info", duration = 4200 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((previous) => [...previous, { id, title, message, type }]);
      const timeoutId = window.setTimeout(() => removeToast(id), duration);
      timeoutMapRef.current.set(id, timeoutId);
      return id;
    },
    [removeToast],
  );

  const value = useMemo(
    () => ({
      pushToast,
      success: (message, title = "Done") => pushToast({ title, message, type: "success" }),
      error: (message, title = "Attention") => pushToast({ title, message, type: "error" }),
      info: (message, title = "Note") => pushToast({ title, message, type: "info" }),
      removeToast,
    }),
    [pushToast, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => {
          const config = toastStyles[toast.type] || toastStyles.info;
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur ${config.className}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-90">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-full p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
};
