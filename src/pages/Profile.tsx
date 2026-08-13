import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard as Edit3, Check, X, Github, Activity, LogOut, Shield, BookOpen, HandHeart, Trophy, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageShell, Button, Input, Select } from '@/components/ui';
import { Heatmap } from '@/components/Heatmap';
import { BottomNav } from '@/components/BottomNav';
import { EmptyState } from '@/components/States';
import {
  DOMAINS,
  DOUBT_DOMAINS,
  DOMAIN_MAP,
  type DomainId,
  type DomainPoints,
  type UserProfile,
} from '@/types';
import { fetchActivities, activitiesToHeatmap } from '@/lib/activities';
import { avatarColor } from '@/lib/format';
import { MentorPanel } from '@/components/MentorPanel';

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Other',
];

// ─── domain aggregation helpers ──────────────────────────────────────────────
// pointsByDomain entries can store domain as either a DomainId ('ml') or a
// display name ('AI/ML') depending on which code path wrote them. This
// normalises both forms back to a canonical DomainId → points map.

function resolveDomainId(domainStr: string): DomainId | null {
  if (DOMAIN_MAP[domainStr as DomainId]) return domainStr as DomainId;
  const byName = DOUBT_DOMAINS.find((d) => d.name === domainStr);
  return byName?.id ?? null;
}

function aggregateDomainPoints(
  pointsByDomain: DomainPoints[],
): { id: DomainId; points: number }[] {
  const map = new Map<DomainId, number>();
  for (const dp of pointsByDomain) {
    const id = resolveDomainId(dp.domain);
    if (!id) continue;
    map.set(id, (map.get(id) ?? 0) + dp.points);
  }
  return Array.from(map.entries())
    .map(([id, points]) => ({ id, points }))
    .sort((a, b) => b.points - a.points);
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Profile() {
  const { profile, user, updateProfile, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    fetchActivities(user.uid)
      .then((activities) => setHeatmapData(activitiesToHeatmap(activities)))
      .catch(() => setHeatmapData({}));
  }, [user]);

  const [name, setName] = useState(profile?.name ?? '');
  const [semester, setSemester] = useState(String(profile?.semester ?? 1));
  const [branch, setBranch] = useState(profile?.branch ?? BRANCHES[0]);
  const [domains, setDomains] = useState<DomainId[]>(profile?.domains ?? []);
  const [githubUsername, setGithubUsername] = useState(profile?.githubUsername ?? '');

  if (!profile) {
    return (
      <>
        <PageShell>
          <EmptyState
            title="Profile not set up"
            description="Complete your profile setup to continue."
            action={
              <Button onClick={() => navigate('/profile-setup')}>
                Set up profile
              </Button>
            }
          />
        </PageShell>
        <BottomNav />
      </>
    );
  }

  const toggleDomain = (id: DomainId) => {
    setDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const startEdit = () => {
    setName(profile.name);
    setSemester(String(profile.semester));
    setBranch(profile.branch);
    setDomains(profile.domains);
    setGithubUsername(profile.githubUsername ?? '');
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (domains.length === 0) {
      toast.error('Select at least one domain');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        semester: parseInt(semester, 10),
        branch,
        domains,
        githubUsername: githubUsername.trim() || null,
      });
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      toast.error('Could not log out');
    }
  };

  return (
    <>
      <PageShell>
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Profile</h1>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{user?.email}</p>
          </div>
          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-teal-500 hover:text-teal-300"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </header>

        {/* Role badge */}
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
          <Shield className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400">Role</span>
          <span className="ml-auto rounded-full border border-slate-700 bg-slate-950 px-2.5 py-0.5 font-mono text-[11px] capitalize text-slate-300">
            {profile.role}
          </span>
        </div>

        {!editing ? (
          <>
            <ReputationHeader profile={profile} />

            <DomainProgress pointsByDomain={profile.pointsByDomain} />

            <TopDomains pointsByDomain={profile.pointsByDomain} />

            {/* Heatmap */}
            <section className="mb-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-400" />
                <h2 className="text-sm font-semibold text-slate-200">Contributions</h2>
              </div>
              <Heatmap data={heatmapData} weeks={18} />
            </section>

            {profile.role === 'mentor' && (
              <section className="mb-5">
                <h2 className="mb-3 text-sm font-semibold text-slate-200">Pending Reviews</h2>
                <MentorPanel mentorId={profile.uid} />
              </section>
            )}

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-3 text-sm text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </>
        ) : (
          /* Edit form */
          <form onSubmit={save} className="flex flex-col gap-4">
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex flex-col gap-4">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Select
                  label="Semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>

                <div>
                  <span className="mb-2 block text-xs font-medium text-slate-300">
                    Domains
                  </span>
                  <div className="flex flex-col gap-2">
                    {DOMAINS.map((d) => {
                      const selected = domains.includes(d.id);
                      const Icon = d.icon;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDomain(d.id)}
                          className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all ${
                            selected
                              ? 'border-teal-500/50 bg-teal-500/10'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${selected ? 'text-teal-400' : 'text-slate-500'}`}
                          />
                          <span
                            className={`flex-1 text-sm ${selected ? 'text-slate-100' : 'text-slate-300'}`}
                          >
                            {d.name}
                          </span>
                          {selected && <Check className="h-4 w-4 text-teal-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Input
                  label="GitHub username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="optional"
                />
              </div>
            </section>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={cancelEdit}
                className="flex-1"
              >
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                <Check className="h-4 w-4" /> Save
              </Button>
            </div>
          </form>
        )}
      </PageShell>
      <BottomNav />
    </>
  );
}

// ─── Reputation Header ─────────────────────────────────────────────────────────
// Combines identity (name, branch, semester, GitHub, interests) with the
// big reputation number and the learn-vs-contribution breakdown.

function ReputationHeader({ profile }: { profile: UserProfile }) {
  const initial = profile.name?.trim()?.[0]?.toUpperCase() ?? '?';
  const learn = profile.pointsBreakdown?.learn ?? 0;
  const doubt = profile.pointsBreakdown?.doubt ?? 0;

  return (
    <section className="mb-5 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      {/* Identity row */}
      <div className="flex items-start gap-3.5 p-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-semibold ${avatarColor(profile.uid)}`}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-slate-100">
            {profile.name}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500">
            {profile.branch} · Semester {profile.semester}
          </p>
          {profile.githubUsername && (
            <a
              href={`https://github.com/${profile.githubUsername}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-300 transition-colors hover:text-teal-300"
            >
              <Github className="h-3.5 w-3.5" />
              {profile.githubUsername}
            </a>
          )}
        </div>
      </div>

      {/* Domain interests */}
      {profile.domains.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-800/60 px-4 py-3">
          {profile.domains.map((id) => {
            const d = DOMAIN_MAP[id];
            if (!d) return null;
            const Icon = d.icon;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300"
              >
                <Icon className="h-3 w-3 text-teal-400" />
                {d.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Reputation number */}
      <div className="border-t border-slate-800/60 bg-slate-950/50 px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Reputation
        </p>
        <p className="mt-1 font-mono text-3xl font-bold text-teal-400 tabular-nums">
          {profile.totalPoints}
        </p>

        {/* Breakdown */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <BreakdownCard
            icon={<BookOpen className="h-4 w-4" />}
            label="Learning"
            value={learn}
            accent="text-sky-400"
            barColor="bg-sky-500"
          />
          <BreakdownCard
            icon={<HandHeart className="h-4 w-4" />}
            label="Contribution"
            value={doubt}
            accent="text-teal-400"
            barColor="bg-teal-500"
          />
        </div>
      </div>
    </section>
  );
}

function BreakdownCard({
  icon,
  label,
  value,
  accent,
  barColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  barColor: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="flex items-center gap-1.5">
        <span className={accent}>{icon}</span>
        <span className="text-[11px] font-medium text-slate-400">{label}</span>
      </div>
      <p className={`mt-1.5 font-mono text-xl font-semibold ${accent} tabular-nums`}>
        {value}
      </p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${value > 0 ? 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

// ─── Domain Progress (normalised bars) ─────────────────────────────────────────
// Bars are scaled relative to the student's strongest domain (max = 100%).
// This is purely a visual aid — stored point values are never modified.

function DomainProgress({ pointsByDomain }: { pointsByDomain: DomainPoints[] }) {
  const aggregated = useMemo(
    () => aggregateDomainPoints(pointsByDomain),
    [pointsByDomain],
  );

  const activeDomains = aggregated.filter((d) => d.points > 0);
  const maxPoints = activeDomains.length > 0 ? activeDomains[0].points : 0;

  return (
    <section className="mb-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-1 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-teal-400" />
        <h2 className="text-sm font-semibold text-slate-200">Reputation by Domain</h2>
      </div>
      <p className="mb-4 text-[11px] text-slate-500">
        Activity across technical domains, scaled to your strongest area.
      </p>

      {activeDomains.length === 0 ? (
        <p className="py-6 text-center font-mono text-[11px] text-slate-600">
          No domain activity yet. Pass a quiz or get an answer verified to start building.
        </p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {activeDomains.map((dp) => {
            const domain = DOMAIN_MAP[dp.id];
            if (!domain) return null;
            const Icon = domain.icon;
            const pct = maxPoints > 0 ? Math.round((dp.points / maxPoints) * 100) : 0;
            return (
              <div key={dp.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Icon className="h-3.5 w-3.5 text-teal-400" />
                    {domain.name}
                  </span>
                  <span className="font-mono text-xs font-semibold text-amber-400 tabular-nums">
                    {dp.points}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Top Domains ───────────────────────────────────────────────────────────────

function TopDomains({ pointsByDomain }: { pointsByDomain: DomainPoints[] }) {
  const top = useMemo(
    () => aggregateDomainPoints(pointsByDomain).filter((d) => d.points > 0).slice(0, 3),
    [pointsByDomain],
  );

  if (top.length === 0) return null;

  const medalColors = [
    'text-amber-400 border-amber-500/30 bg-amber-500/10',
    'text-slate-300 border-slate-600/30 bg-slate-700/20',
    'text-amber-600 border-amber-600/30 bg-amber-600/10',
  ];

  return (
    <section className="mb-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-slate-200">Top Domains</h2>
      </div>
      <div className="flex flex-col gap-2">
        {top.map((dp, i) => {
          const domain = DOMAIN_MAP[dp.id];
          if (!domain) return null;
          const Icon = domain.icon;
          return (
            <div
              key={dp.id}
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold ${medalColors[i] ?? 'text-slate-400 border-slate-700 bg-slate-800'}`}
              >
                {i + 1}
              </span>
              <Icon className="h-4 w-4 text-teal-400" />
              <span className="flex-1 text-sm font-medium text-slate-100">
                {domain.name}
              </span>
              <span className="font-mono text-sm font-semibold text-amber-400 tabular-nums">
                {dp.points}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
