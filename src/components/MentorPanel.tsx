import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MessageSquare, ChevronRight } from 'lucide-react';
import { DOMAIN_MAP, type Doubt } from '@/types';
import { fetchDoubtsAwaitingReview } from '@/lib/doubts';
import { ListSkeleton, EmptyState, ErrorState } from '@/components/States';

/**
 * Mentor review queue — a single, focused feed of doubts that have at
 * least one reply and aren't verified yet. Tapping a doubt opens the
 * normal doubt detail page, where verifying a specific reply (and
 * awarding its author points) actually happens. This panel is just the
 * "what needs my attention" pointer list, not where verification itself
 * takes place.
 */
export function MentorPanel({ mentorId: _mentorId }: { mentorId: string }) {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchDoubtsAwaitingReview();
      setDoubts(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load review queue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-400" />
          <h2 className="text-sm font-semibold text-teal-200">Doubts awaiting review</h2>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Browse answered doubts and verify the good replies — verifying awards
          +30 points to whoever wrote it.
        </p>
      </div>

      {loading ? (
        <ListSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : doubts.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-5 w-5" />}
          title="Nothing pending"
          description="Doubts with a reply will show up here for you to review."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {doubts.map((doubt) => {
            const domain = DOMAIN_MAP[doubt.domain];
            return (
              <button
                key={doubt.id}
                onClick={() => navigate(`/doubts/${doubt.id}`)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-left transition-all hover:border-teal-500/40 hover:bg-slate-800/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {doubt.question}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {domain?.name} · by {doubt.authorName}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-400" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
