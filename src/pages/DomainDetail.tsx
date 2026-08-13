import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  FolderGit2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { PageShell } from '@/components/ui';
import { EmptyState } from '@/components/States';
import { Button } from '@/components/ui';
import { DOMAIN_MAP, type DomainId } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { LearnTab } from '@/components/LearnTab';
import { PerformTab } from '@/components/PerformTab';
import { DoubtTab } from '@/components/DoubtTab';
import { MentorPanel } from '@/components/MentorPanel';

type Tab = 'learn' | 'perform' | 'doubt';

const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'perform', label: 'Perform', icon: FolderGit2 },
  { id: 'doubt', label: 'Doubt-Help', icon: HelpCircle },
];

export default function DomainDetail() {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('learn');

  const domain = domainId ? DOMAIN_MAP[domainId as keyof typeof DOMAIN_MAP] : undefined;

  if (!domain) {
    return (
      <PageShell>
        <EmptyState
          title="Domain not found"
          description="This domain does not exist."
          action={
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          }
        />
      </PageShell>
    );
  }

  const Icon = domain.icon;
  const isMentor = profile?.role === 'mentor';

  return (
    <PageShell>
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-4 flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <header className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
          <Icon className="h-6 w-6 text-teal-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-100">{domain.name}</h1>
          <p className="font-mono text-[11px] text-slate-500">Learn → Prove → Contribute</p>
        </div>
      </header>

      {/* Mentor badge */}
      {isMentor && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/5 p-3">
          <ShieldCheck className="h-4 w-4 text-teal-400" />
          <span className="text-xs text-teal-200">Mentor mode — validation controls enabled</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
        {TABS.map((t) => {
          const TabIcon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
                active
                  ? 'bg-teal-500/15 text-teal-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'learn' && <LearnTab domain={domain.id as DomainId} />}
      {tab === 'perform' && <PerformTab />}
      {tab === 'doubt' && <DoubtTab domain={domain.id as DomainId} />}

      {/* Mentor panel — only shown to mentors, at the bottom */}
      {isMentor && (
        <div className="mt-6 border-t border-slate-800 pt-4">
          <MentorPanel mentorId={profile!.uid} />
        </div>
      )}
    </PageShell>
  );
}
