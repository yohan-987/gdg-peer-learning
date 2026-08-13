import { Users, Github, User as UserIcon } from 'lucide-react';
import { PageShell } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';

interface TeamMember {
  role: string;
  githubUrl?: string;
}

const LEADS: TeamMember[] = [
  { role: 'Lead - Web Development', githubUrl: 'https://github.com' },
  { role: 'Lead - AI/ML', githubUrl: 'https://github.com' },
  { role: 'Lead - Cloud Computing', githubUrl: 'https://github.com' },
  { role: 'Lead - App Development', githubUrl: 'https://github.com' },
];

const CO_LEADS: TeamMember[] = [
  { role: 'Co-Lead - Web Development' },
  { role: 'Co-Lead - AI/ML' },
  { role: 'Co-Lead - Cloud Computing' },
  { role: 'Co-Lead - App Development' },
  { role: 'Co-Lead - DSA & CP' },
  { role: 'Co-Lead - Cybersecurity' },
  { role: 'Co-Lead - IoT' },
  { role: 'Co-Lead - Design' },
];

const CORE_MEMBERS: TeamMember[] = [
  { role: 'Core Member - Web Development' },
  { role: 'Core Member - AI/ML' },
  { role: 'Core Member - Cloud Computing' },
  { role: 'Core Member - App Development' },
  { role: 'Core Member - DSA & CP' },
  { role: 'Core Member - Cybersecurity' },
  { role: 'Core Member - IoT' },
  { role: 'Core Member - Design' },
  { role: 'Core Member - Management' },
  { role: 'Core Member - Social Media' },
  { role: 'Core Member - Content' },
];

export default function Team() {
  return (
    <>
      <PageShell>
        <header className="mb-5">
          <h1 className="text-xl font-semibold text-slate-100">Team Roster</h1>
          <p className="mt-1 text-xs text-slate-400">
            The core team driving the GDG program.
          </p>
        </header>

        <Section title="Leads" members={LEADS} />
        <Section title="Co-Leads" members={CO_LEADS} />
        <Section title="Core Members" members={CORE_MEMBERS} />
      </PageShell>
      <BottomNav />
    </>
  );
}

function Section({ title, members }: { title: string; members: TeamMember[] }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">{title}</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {members.map((member, i) => (
          <MemberCard key={i} member={member} />
        ))}
      </div>
    </section>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
        <UserIcon className="h-7 w-7 text-slate-500" />
      </div>
      <p className="text-sm font-medium text-slate-100">xyz</p>
      <p className="text-[11px] text-slate-400">{member.role}</p>
      {member.githubUrl && (
        <a
          href={member.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 flex items-center justify-center rounded-full border border-slate-700 p-1.5 text-slate-400 transition-colors hover:border-teal-500 hover:text-teal-300"
        >
          <Github className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
