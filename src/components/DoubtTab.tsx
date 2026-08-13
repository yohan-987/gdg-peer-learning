import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import { DOUBT_DOMAINS, type DomainId, type Doubt, type DoubtStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fetchDoubts, postDoubt } from '@/lib/doubts';
import { Button, Select } from '@/components/ui';
import { ListSkeleton, EmptyState, ErrorState } from '@/components/States';

interface DoubtTabProps {
  domain: DomainId;
}

const statusConfig: Record<DoubtStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  answered: { label: 'Answered', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  verified: { label: 'Verified', color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' },
};

export function DoubtTab({ domain }: DoubtTabProps) {
  const { user, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [selectedDomain, setSelectedDomain] = useState<DomainId>(domain);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const doubtList = await fetchDoubts(domain);
      setDoubts(doubtList);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load doubts';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!selectedDomain || !question.trim()) {
      toast.error('Select a domain and write your question');
      return;
    }
    setSubmitting(true);
    try {
      const doubtId = await postDoubt({
        authorId: user.uid,
        authorName: profile.name,
        authorRole: profile.role,
        domain: selectedDomain,
        question: question.trim(),
      });
      toast.success('Doubt posted');
      setQuestion('');
      setSelectedDomain(domain);
      setShowForm(false);
      // Take them straight to the focused thread for their new doubt.
      navigate(`/doubts/${doubtId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to post doubt';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ListSkeleton count={3} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-2 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-200">Domain doubts</h2>
        </div>
        <p className="text-xs text-slate-400">
          Ask questions and help peers. Original askers select the best answer; mentors verify it.
        </p>
      </div>

      {/* Post doubt toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 py-3.5 text-sm font-medium text-slate-300 transition-all hover:border-teal-500/50 hover:text-teal-300"
        >
          <Plus className="h-4 w-4" />
          Post a doubt
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-800 bg-slate-900 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">New doubt</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <Select
              label="Domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as DomainId)}
            >
              {DOUBT_DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-300">
                Question
              </span>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What's your doubt?"
                required
                rows={3}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
              />
            </label>
            <Button type="submit" loading={submitting} className="w-full">
              Post doubt
            </Button>
          </div>
        </form>
      )}

      {/* Doubts list — tapping any card opens the dedicated, distraction-free thread page */}
      {doubts.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="h-5 w-5" />}
          title="No doubts yet"
          description="Be the first to ask a question in this domain."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {doubts.map((doubt) => {
            const cfg = statusConfig[doubt.status];
            return (
              <button
                key={doubt.id}
                onClick={() => navigate(`/doubts/${doubt.id}`)}
                className="group flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 text-left transition-all hover:border-slate-700 hover:bg-slate-800/60 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm font-medium text-slate-100">
                    {doubt.question}
                  </p>
                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium ${cfg.color}`}
                  >
                    {doubt.status === 'verified' && <ShieldCheck className="h-3 w-3" />}
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                    <MessageCircle className="h-3 w-3" />
                    by {doubt.authorName}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
