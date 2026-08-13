import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronRight, MessageCircle } from 'lucide-react';
import { PageShell } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { ListSkeleton, EmptyState, ErrorState } from '@/components/States';
import { DOUBT_DOMAINS, DOMAIN_MAP, type DomainId, type Doubt, type DoubtStatus } from '@/types';
import { fetchAllDoubts } from '@/lib/doubts';

type Filter = 'all' | DomainId;

const CHIPS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...DOUBT_DOMAINS.map((d) => ({ id: d.id as Filter, label: d.name })),
];

const statusConfig: Record<DoubtStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  answered: { label: 'Answered', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  verified: { label: 'Verified', color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' },
};

export default function Doubts() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAllDoubts();
      setDoubts(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load doubts';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered =
    filter === 'all' ? doubts : doubts.filter((d) => d.domain === filter);

  return (
    <>
      <PageShell>
        <header className="mb-5">
          <h1 className="text-xl font-semibold text-slate-100">Doubts</h1>
          <p className="mt-1 text-xs text-slate-400">
            Help peers by answering questions across domains.
          </p>
        </header>

        {/* Filter chips */}
        <div className="mb-5 flex flex-wrap gap-2">
          {CHIPS.map((chip) => {
            const active = filter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setFilter(chip.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? 'border-teal-500/50 bg-teal-500/15 text-teal-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <ListSkeleton count={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<HelpCircle className="h-5 w-5" />}
            title="No doubts yet"
            description="When students post doubts, they will appear here. Tap a domain to ask or answer questions."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((doubt) => {
              const domain = DOMAIN_MAP[doubt.domain];
              const cfg = statusConfig[doubt.status];
              return (
                <button
                  key={doubt.id}
                  onClick={() => navigate(`/doubts/${doubt.id}`)}
                  className="group flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 text-left transition-all hover:border-slate-700 hover:bg-slate-800/60 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-100">
                        {doubt.question}
                      </p>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {domain && (
                        <span className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-2.5 py-0.5 text-[10px] text-slate-400">
                          {domain.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                        <MessageCircle className="h-3 w-3" />
                        by {doubt.authorName}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </PageShell>
      <BottomNav />
    </>
  );
}
