export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-teal-400" />
      <p className="font-mono text-xs text-slate-400">{label}</p>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 h-4 w-1/3 animate-pulse rounded bg-slate-800" />
      <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-800/70" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800/70" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/70 text-slate-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {description && (
        <p className="max-w-xs text-xs text-slate-400">{description}</p>
      )}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-6 py-12 text-center">
      <p className="text-sm font-medium text-red-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-200 transition-colors hover:border-teal-500 hover:text-teal-300"
        >
          Try again
        </button>
      )}
    </div>
  );
}
