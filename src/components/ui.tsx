import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, className = '', ...props }, ref) => {
    return (
      <label className="block">
        {label && (
          <span className="mb-1.5 block text-xs font-medium text-slate-300">
            {label}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 ${className}`}
          {...props}
        />
        {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      </label>
    );
  },
);
Input.displayName = 'Input';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const styles = {
    primary:
      'bg-teal-500 text-slate-950 hover:bg-teal-400 active:scale-[0.98] font-semibold',
    secondary:
      'border border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700 hover:bg-slate-800 active:scale-[0.98]',
    ghost: 'text-slate-300 hover:text-teal-300 hover:bg-slate-900',
  };
  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export function Select({
  label,
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-slate-300">
          {label}
        </span>
      )}
      <select
        className={`w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[420px] bg-slate-950 px-4 pb-24 pt-6">
      {children}
    </div>
  );
}
