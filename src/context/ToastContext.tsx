import { CheckCircle2, XCircle, X, Info } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove],
  );

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[100] flex w-[90%] max-w-sm -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => {
          const Icon =
            t.type === 'success'
              ? CheckCircle2
              : t.type === 'error'
                ? XCircle
                : Info;
          const accent =
            t.type === 'success'
              ? 'text-teal-400'
              : t.type === 'error'
                ? 'text-red-400'
                : 'text-sky-400';
          const ring =
            t.type === 'success'
              ? 'border-teal-500/40'
              : t.type === 'error'
                ? 'border-red-500/40'
                : 'border-sky-500/40';
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${ring} bg-slate-900/95 px-4 py-3 shadow-lg backdrop-blur animate-[slideup_0.2s_ease-out]`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${accent}`} />
              <p className="flex-1 text-sm text-slate-100">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="text-slate-500 transition-colors hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
