import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen,
  ExternalLink,
  ClipboardCheck,
  Award,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { type Session, type DomainId, type QuizAttempt } from '@/types';
import { fetchSessions, getQuizAttempt } from '@/lib/sessions';
import { useAuth } from '@/context/AuthContext';
import { QuizModal } from '@/components/QuizModal';
import { ListSkeleton, EmptyState, ErrorState } from '@/components/States';

interface LearnTabProps {
  domain: DomainId;
}

export function LearnTab({ domain }: LearnTabProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizSession, setQuizSession] = useState<Session | null>(null);
  const [attempts, setAttempts] = useState<Record<string, QuizAttempt>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSessions(domain);
      setSessions(list);

      if (user) {
        const attemptMap: Record<string, QuizAttempt> = {};
        await Promise.all(
          list.map(async (s) => {
            const att = await getQuizAttempt(user.uid, s.id);
            if (att) attemptMap[s.id] = att;
          }),
        );
        setAttempts(attemptMap);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [domain, user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ListSkeleton count={3} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5" />}
        title="No sessions yet"
        description="Learning sessions for this domain will appear here."
      />
    );
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-slate-200">Learning sessions</h2>
          </div>
          <p className="text-xs text-slate-400">
            Curated external resources with a quiz to verify your understanding. Pass with 70% to earn +20 points.
          </p>
        </div>

        {sessions.map((session) => {
          const attempt = attempts[session.id];
          const passed = attempt?.passed ?? false;

          return (
            <div
              key={session.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-100">
                    {session.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span className="font-mono text-[11px] text-slate-500">
                      {session.date}
                    </span>
                  </div>
                </div>
                {passed && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 text-[10px] font-medium text-teal-300">
                    <Award className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>

              {/* Resource links */}
              <div className="mb-3 flex flex-col gap-1.5">
                {session.resourceLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-teal-500/40 hover:text-teal-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{link.label}</span>
                  </a>
                ))}
              </div>

              {/* Quiz button */}
              <button
                onClick={() => setQuizSession(session)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 py-2.5 text-xs font-medium text-slate-200 transition-all hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-300 active:scale-[0.98]"
              >
                {passed ? (
                  <>
                    <Award className="h-3.5 w-3.5 text-teal-400" />
                    Retake quiz
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Take quiz
                  </>
                )}
              </button>
            </div>
          );
        })}
      </section>

      {quizSession && (
        <QuizModal
          session={quizSession}
          onClose={() => setQuizSession(null)}
          onCompleted={load}
        />
      )}
    </>
  );
}
