import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, BrainCircuit } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Input, Select } from '@/components/ui';
import { DOMAINS, type DomainId } from '@/types';

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Other',
];

export default function ProfileSetup() {
  const { user, completeProfileSetup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('1');
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [selectedDomains, setSelectedDomains] = useState<DomainId[]>([]);
  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleDomain = (id: DomainId) => {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (selectedDomains.length === 0) {
      toast.error('Select at least one domain');
      return;
    }
    setLoading(true);
    try {
      await completeProfileSetup({
        name: name.trim(),
        semester: parseInt(semester, 10),
        branch,
        domains: selectedDomains,
        githubUsername: githubUsername.trim() || null,
      });
      toast.success('Profile created');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Profile setup failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10">
            <BrainCircuit className="h-6 w-6 text-teal-400" />
          </div>
          <h1 className="text-lg font-semibold text-slate-100">Set up your profile</h1>
          <p className="mt-1 text-xs text-slate-400">
            This information appears on the leaderboard and your profile.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <Input
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
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
              Domains <span className="text-slate-500">(select one or more)</span>
            </span>
            <div className="flex flex-col gap-2">
              {DOMAINS.map((d) => {
                const selected = selectedDomains.includes(d.id);
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

          <Button type="submit" loading={loading} className="w-full">
            Complete setup
          </Button>
        </form>
      </div>
    </div>
  );
}
