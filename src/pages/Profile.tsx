import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit3,
  Check,
  X,
  Github,
  Activity,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageShell, Button, Input, Select } from '@/components/ui';
import { Heatmap } from '@/components/Heatmap';
import { BottomNav } from '@/components/BottomNav';
import { EmptyState, ErrorState } from '@/components/States';
import { DOMAINS, type DomainId } from '@/types';
import { fetchActivities, activitiesToHeatmap } from '@/lib/activities';
import { MentorPanel } from '@/components/MentorPanel';

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Other',
];

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
            {/* Read-only profile */}
            <section className="mb-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex flex-col gap-3">
                <Field label="Name" value={profile.name} />
                <Field label="Semester" value={`Semester ${profile.semester}`} />
                <Field label="Branch" value={profile.branch} />
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-400">Domains</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.domains.map((id) => {
                      const d = DOMAINS.find((x) => x.id === id);
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
                </div>
                {profile.githubUsername && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-slate-400">GitHub</p>
                    <a
                      href={`https://github.com/${profile.githubUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-300 transition-colors hover:text-teal-300"
                    >
                      <Github className="h-3.5 w-3.5" />
                      {profile.githubUsername}
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Points */}
            <section className="mb-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Total points</h2>
                <span className="font-mono text-lg font-semibold text-amber-400">
                  {profile.totalPoints}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <PointCell label="Learn" value={profile.pointsBreakdown.learn} />
                <PointCell label="Doubt" value={profile.pointsBreakdown.doubt} />
              </div>
            </section>

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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      <p className="text-sm text-slate-100">{value}</p>
    </div>
  );
}

function PointCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-center">
      <p className="font-mono text-base font-semibold text-teal-300">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
