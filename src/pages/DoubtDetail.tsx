import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { DOMAIN_MAP, type Doubt, type Reply, type DoubtStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  fetchDoubtById,
  postReply,
  verifyReply,
  subscribeToReplies,
} from '@/lib/doubts';
import { timeAgo, avatarColor } from '@/lib/format';
import { CardSkeleton, ErrorState, EmptyState } from '@/components/States';

const statusConfig: Record<DoubtStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  answered: { label: 'Answered', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  verified: { label: 'Verified', color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' },
};

function RoleBadge({ role }: { role: 'student' | 'mentor' | 'admin' }) {
  if (role === 'mentor' || role === 'admin') {
    return (
      <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-medium text-teal-300">
        Mentor
      </span>
    );
  }
  return (
    <span className="rounded-full border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
      Student
    </span>
  );
}

function Avatar({ name, userId }: { name: string; userId: string }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?';
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(userId)}`}
    >
      {initial}
    </div>
  );
}

/**
 * Distraction-free doubt detail page — this route intentionally renders
 * NONE of the app's normal chrome (no domain tabs, no page headers, no
 * filter chips). Only: back button, the question, the reply feed, and
 * the reply composer.
 */
export default function DoubtDetail() {
  const { doubtId } = useParams<{ doubtId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const toast = useToast();

  const [doubt, setDoubt] = useState<Doubt | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = async () => {
    if (!doubtId) return;
    setLoading(true);
    setError(null);
    try {
      const d = await fetchDoubtById(doubtId);
      if (!d) {
        setError('This doubt no longer exists.');
      } else {
        setDoubt(d);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load doubt';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doubtId]);

  useEffect(() => {
    if (!doubtId) return;
    const unsub = subscribeToReplies(doubtId, setReplies);
    return unsub;
  }, [doubtId]);

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !doubtId || !replyText.trim()) return;
    setPostingReply(true);
    try {
      await postReply({
        doubtId,
        authorId: user.uid,
        authorName: profile.name,
        authorRole: profile.role,
        text: replyText.trim(),
      });
      setReplyText('');
      toast.success('Reply posted');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to post reply';
      toast.error(msg);
    } finally {
      setPostingReply(false);
    }
  };

  const handleVerify = async (replyId: string) => {
    if (!user || !doubtId || !doubt) return;
    setVerifying(replyId);
    try {
      const result = await verifyReply({
        doubtId,
        replyId,
        mentorId: user.uid,
        domain: doubt.domain,
      });
      toast.success(
        result.pointsAwarded
          ? 'Verified! +30 points awarded.'
          : 'Already verified.',
      );
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to verify reply';
      toast.error(msg);
    } finally {
      setVerifying(null);
    }
  };

  // ─── distraction-free shell: no PageShell header, no BottomNav, no domain tabs ───
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-slate-950 px-4 py-4">
      <button
        onClick={() => navigate('/doubts')}
        className="mb-4 flex w-fit items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-teal-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Doubts
      </button>

      {loading ? (
        <CardSkeleton />
      ) : error || !doubt ? (
        <ErrorState message={error ?? 'Doubt not found'} onRetry={load} />
      ) : (
        <>
          <DoubtQuestionCard doubt={doubt} />

          <div className="mt-5 flex flex-col gap-3">
            {replies.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="h-5 w-5" />}
                title="No replies yet"
                description="Be the first to answer this question."
              />
            ) : (
              sortReplies(replies).map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  canVerify={
                    profile?.role === 'mentor' && !reply.isMentorVerified
                  }
                  verifying={verifying === reply.id}
                  onVerify={() => handleVerify(reply.id)}
                />
              ))
            )}
          </div>

          <form
            onSubmit={handlePostReply}
            className="sticky bottom-4 mt-5 flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2.5"
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add my reply..."
              rows={1}
              className="flex-1 resize-none rounded-lg border-none bg-transparent px-2 py-1.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
            />
            <button
              type="submit"
              disabled={postingReply || !replyText.trim()}
              className="flex shrink-0 items-center justify-center self-end rounded-lg bg-teal-500 px-3 py-2 text-slate-950 transition-colors hover:bg-teal-400 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

/** Verified replies first, then newest-first for the rest. */
function sortReplies(replies: Reply[]): Reply[] {
  const verified = replies.filter((r) => r.isMentorVerified);
  const rest = replies.filter((r) => !r.isMentorVerified).slice().reverse();
  return [...verified, ...rest];
}

function DoubtQuestionCard({ doubt }: { doubt: Doubt }) {
  const domain = DOMAIN_MAP[doubt.domain];
  const cfg = statusConfig[doubt.status];
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={doubt.authorName} userId={doubt.authorId} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-slate-100">{doubt.authorName}</span>
              <RoleBadge role={doubt.authorRole} />
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
              {domain && <span>{domain.name}</span>}
              <span>·</span>
              <span>{timeAgo(doubt.createdAt)}</span>
            </p>
          </div>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium ${cfg.color}`}
        >
          {doubt.status === 'verified' && <ShieldCheck className="h-3 w-3" />}
          {cfg.label}
        </span>
      </div>
      <p className="text-[15px] leading-relaxed text-slate-100">{doubt.question}</p>
    </div>
  );
}

function ReplyCard({
  reply,
  canVerify,
  verifying,
  onVerify,
}: {
  reply: Reply;
  canVerify: boolean;
  verifying: boolean;
  onVerify: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        reply.isMentorVerified
          ? 'border-teal-500/40 bg-teal-500/5'
          : 'border-slate-800 bg-slate-900'
      }`}
    >
      <div className="flex gap-2.5">
        <Avatar name={reply.authorName} userId={reply.authorId} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-200">{reply.authorName}</span>
            <RoleBadge role={reply.authorRole} />
            <span className="text-[10px] text-slate-600">{timeAgo(reply.createdAt)}</span>
            {reply.isMentorVerified && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-teal-300">
                <ShieldCheck className="h-3 w-3" />
                Mentor Verified
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-slate-200">{reply.text}</p>

          {canVerify && (
            <button
              onClick={onVerify}
              disabled={verifying}
              className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 px-2.5 py-1.5 text-[11px] font-medium text-teal-300 transition-colors hover:bg-teal-500/20 disabled:opacity-50"
            >
              <ShieldCheck className="h-3 w-3" />
              {verifying ? 'Verifying…' : 'Verify & Award Points'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
