import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Activity, ChevronRight, Sparkles, Database } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { db } from '@/firebase';
import { PageShell, Button } from '@/components/ui';
import { Heatmap } from '@/components/Heatmap';
import { BottomNav } from '@/components/BottomNav';
import { EmptyState, CardSkeleton } from '@/components/States';
import { DOMAINS, type DomainId } from '@/types';
import { fetchActivities, activitiesToHeatmap } from '@/lib/activities';
import { seedDemoData } from '@/lib/seed';

function domainPoints(profile: { pointsByDomain: Record<string, number> }, id: DomainId) {
  return profile.pointsByDomain[id] ?? 0;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [showSeed, setShowSeed] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!user) return;
    setHeatmapLoading(true);
    fetchActivities(user.uid)
      .then((activities) => setHeatmapData(activitiesToHeatmap(activities)))
      .catch(() => setHeatmapData({}))
      .finally(() => setHeatmapLoading(false));
  }, [user]);

  // Show the seed button only when the app looks freshly deployed —
  // no doubts and no submissions exist anywhere yet.
  useEffect(() => {
    (async () => {
      try {
        const [doubtsSnap, subsSnap] = await Promise.all([
          getDocs(query(collection(db, 'doubts'), limit(1))),
          getDocs(query(collection(db, 'submissions'), limit(1))),
        ]);
        setShowSeed(doubtsSnap.empty && subsSnap.empty);
      } catch {
        setShowSeed(false);
      }
    })();
  }, []);

  const handleSeed = async () => {
    if (!user || !profile) return;
    setSeeding(true);
    try {
      await seedDemoData(user.uid, profile.name);
      toast.success('Demo data added — sample doubts and projects are ready.');
      setShowSeed(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to seed demo data';
      toast.error(msg);
    } finally {
      setSeeding(false);
    }
  };

  const hasActivity = profile && profile.totalPoints > 0;
  const total = profile?.totalPoints ?? 0;
  const breakdown = profile?.pointsBreakdown;

  return (
    <>
      <PageShell>
        <header className="mb-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-teal-400">
            GDG On Campus
          </p>
          <h1 className="mt-0.5 text-xl font-semibold text-slate-100">Peer Learning</h1>
          <p className="mt-1 text-xs text-slate-400">Learn → Prove → Contribute</p>
          <p className="mt-2 text-xs text-slate-500">
            Build skills, demonstrate your work, and contribute to your peers.
          </p>
        </header>

        {showSeed && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-4">
            <div>
              <p className="text-xs font-medium text-slate-200">Empty demo?</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Add sample doubts and project submissions to show off the app.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleSeed}
              loading={seeding}
              className="shrink-0"
            >
              <Database className="h-3.5 w-3.5" />
              Seed Demo Data
            </Button>
          </div>
        )}

        {/* Contribution heatmap */}
        <section className="mb-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-slate-200">Your contributions</h2>
          </div>
          {heatmapLoading ? (
            <CardSkeleton />
          ) : (
            <Heatmap data={heatmapData} weeks={18} />
          )}
          {!heatmapLoading && !hasActivity && (
            <p className="mt-3 font-mono text-[11px] text-slate-500">
              No contributions yet. Pass a quiz or get a doubt reply verified by a mentor to fill your heatmap.
            </p>
          )}
        </section>

        {/* Points summary */}
        {hasActivity && (
          <section className="mb-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Points</h2>
              <span className="font-mono text-lg font-semibold text-amber-400">
                {total}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-center">
                <p className="font-mono text-base font-semibold text-teal-300">
                  {breakdown?.learn ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                  Learn
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-center">
                <p className="font-mono text-base font-semibold text-teal-300">
                  {breakdown?.doubt ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                  Contribute
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Domains */}
        <section className="mb-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Domains</h2>
          <div className="flex flex-col gap-2.5">
            {DOMAINS.map((d) => {
              const Icon = d.icon;
              const pts = profile ? domainPoints(profile, d.id) : 0;
              return (
                <button
                  key={d.id}
                  onClick={() => navigate(`/domain/${d.id}`)}
                  className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-left transition-all hover:border-slate-700 hover:bg-slate-800/60 active:scale-[0.99]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950">
                    <Icon className="h-5 w-5 text-teal-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100">{d.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-amber-400">
                      {pts} pts
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
                </button>
              );
            })}
          </div>
        </section>

        {!hasActivity && (
          <div className="mb-4">
            <EmptyState
              icon={<Sparkles className="h-5 w-5" />}
              title="Start your journey"
              description="Pick a domain, complete a learning session, and begin building your contribution record."
            />
          </div>
        )}
      </PageShell>
      <BottomNav />
    </>
  );
}
