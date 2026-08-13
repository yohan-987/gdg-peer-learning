import { useState } from 'react';
import { X, CheckCircle2, Award, RotateCcw } from 'lucide-react';
import { type Session } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { submitQuizAttempt, getQuizAttempt } from '@/lib/sessions';
import { Button } from '@/components/ui';

interface QuizModalProps {
  session: Session;
  onClose: () => void;
  onCompleted?: () => void;
}

export function QuizModal({ session, onClose, onCompleted }: QuizModalProps) {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(session.quizQuestions.length).fill(null),
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    pointsAwarded: boolean;
  } | null>(null);
  const [previousAttempt, setPreviousAttempt] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  const allAnswered = answers.every((a) => a !== null);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Check for existing attempt first
      const existing = await getQuizAttempt(user.uid, session.id);
      if (existing && existing.passed) {
        setPreviousAttempt({
          score: existing.score,
          passed: existing.passed,
        });
        setResult({
          score: existing.score,
          passed: true,
          pointsAwarded: false,
        });
        toast.info('You already passed this quiz. Showing your previous result.');
        onCompleted?.();
        return;
      }

      const res = await submitQuizAttempt({
        userId: user.uid,
        sessionId: session.id,
        domain: session.domain,
        answers: answers as number[],
        questions: session.quizQuestions,
      });

      setResult(res);

      if (res.passed) {
        if (res.pointsAwarded) {
          toast.success('Quiz passed! +20 Learn points awarded.');
        } else {
          toast.success('Quiz passed! (Points already awarded previously)');
        }
        onCompleted?.();
      } else {
        toast.error(`You scored ${Math.round(res.score * 100)}%. Need 70% to pass. Try again!`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Quiz submission failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setPreviousAttempt(null);
    setAnswers(new Array(session.quizQuestions.length).fill(null));
  };

  const correctCount = result
    ? Math.round(result.score * session.quizQuestions.length)
    : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-slate-800 bg-slate-900 sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-100">Quiz: {session.title}</h2>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">
              {session.quizQuestions.length} questions · 70% to pass
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {result ? (
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            {result.passed ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-teal-500/40 bg-teal-500/10">
                  <Award className="h-8 w-8 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Verified Skill Badge</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    You passed with {Math.round(result.score * 100)}% ({correctCount}/{session.quizQuestions.length})
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-teal-300">
                    {result.pointsAwarded ? '+20 Learn points' : 'Points already awarded'}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-slate-500">
                  Verified · {profile?.name}
                </p>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10">
                  <X className="h-8 w-8 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Not quite there</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    You scored {Math.round(result.score * 100)}% ({correctCount}/{session.quizQuestions.length}). Need 70% to pass.
                  </p>
                </div>
                <Button onClick={handleRetry} variant="secondary">
                  <RotateCcw className="h-4 w-4" /> Retry quiz
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-5">
                {session.quizQuestions.map((q, qi) => (
                  <div key={qi}>
                    <p className="mb-3 text-sm font-medium text-slate-100">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt, oi) => {
                        const selected = answers[qi] === oi;
                        return (
                          <button
                            key={oi}
                            onClick={() =>
                              setAnswers((prev) => {
                                const next = [...prev];
                                next[qi] = oi;
                                return next;
                              })
                            }
                            className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-all ${
                              selected
                                ? 'border-teal-500/50 bg-teal-500/10 text-teal-200'
                                : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono ${
                                selected
                                  ? 'border-teal-500 bg-teal-500 text-slate-950'
                                  : 'border-slate-700 text-slate-500'
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 p-4">
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={!allAnswered}
                className="w-full"
              >
                {allAnswered ? 'Submit quiz' : `Answer all questions (${answers.filter((a) => a !== null).length}/${session.quizQuestions.length})`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
