import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { PageShell } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { ListSkeleton, EmptyState, ErrorState } from '@/components/States';
import { Trophy, Medal, Crown, type LucideIcon } from 'lucide-react';
import type { UserProfile } from '@/types';

export default function Leaderboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data() as UserProfile);
      setUsers(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load leaderboard';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ranked = [...users].sort((a, b) => b.totalPoints - a.totalPoints);
  const hasPoints = ranked.some((u) => u.totalPoints > 0);

  return (
    <>
      <PageShell>
        <header className="mb-5">
          <h1 className="text-xl font-semibold text-slate-100">Leaderboard</h1>
          <p className="mt-1 text-xs text-slate-400">Top contributors across all domains</p>
        </header>

        {loading ? (
          <ListSkeleton count={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : ranked.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-5 w-5" />}
            title="No users yet"
            description="Once students join and start contributing, the leaderboard will appear here."
          />
        ) : !hasPoints ? (
          <EmptyState
            icon={<Trophy className="h-5 w-5" />}
            title="No points recorded yet"
            description="Contributions will determine the rankings. Start learning and contributing to climb up."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {ranked.map((u, i) => (
              <LeaderboardRow key={u.uid} user={u} rank={i + 1} />
            ))}
          </div>
        )}

        {!loading && !error && ranked.length > 0 && (
          <p className="mt-5 text-center text-[11px] text-slate-600">
            A visible, verifiable contribution record — not an automatic selection.
          </p>
        )}
      </PageShell>
      <BottomNav />
    </>
  );
}

function LeaderboardRow({ user, rank }: { user: UserProfile; rank: number }) {
  const rankIcon: LucideIcon | null =
    rank === 1 ? Crown : rank === 2 ? Medal : rank === 3 ? Trophy : null;
  const rankColor =
    rank === 1
      ? 'text-amber-400'
      : rank === 2
        ? 'text-slate-300'
        : rank === 3
          ? 'text-amber-600'
          : 'text-slate-500';

  const RankIcon = rankIcon;
  const breakdown = user.pointsBreakdown ?? { learn: 0, doubt: 0 };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3.5">
      <div className="flex items-center gap-3">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center ${rankColor}`}>
          {RankIcon ? (
            <RankIcon className="h-5 w-5" />
          ) : (
            <span className="font-mono text-sm font-semibold">{rank}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-100">{user.name}</p>
          <p className="truncate font-mono text-[11px] text-slate-500">
            {user.branch} · S{user.semester}
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono text-sm font-semibold text-amber-400">
            {user.totalPoints}
          </p>
          <p className="font-mono text-[10px] text-slate-500">pts</p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-3 border-t border-slate-800 pt-2.5 pl-10 font-mono text-[11px]">
        <span className="text-teal-400">{breakdown.learn}</span>
        <span className="text-slate-600">learn</span>
        <span className="text-slate-300">{breakdown.doubt}</span>
        <span className="text-slate-600">doubt</span>
      </div>
    </div>
  );
}
