import { useEffect, useState } from 'react';
import { Github, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchGitHubProfile, type GitHubProfile } from '@/lib/github';

/**
 * "Prove" evidence for a domain — GitHub activity only. Project
 * submissions with mentor approval used to live here too, but that
 * created a review bottleneck for a hackathon-scale mentor team, so it
 * was removed. GitHub evidence never needed approval in the first place
 * (it's always been reference-only, never point-generating) — that part
 * stays exactly as it was.
 */
export function PerformTab() {
  const { profile } = useAuth();
  const [ghProfile, setGhProfile] = useState<GitHubProfile | null>(null);
  const [ghLoading, setGhLoading] = useState(false);

  useEffect(() => {
    if (!profile?.githubUsername) {
      setGhProfile(null);
      return;
    }
    setGhLoading(true);
    fetchGitHubProfile(profile.githubUsername)
      .then(setGhProfile)
      .finally(() => setGhLoading(false));
  }, [profile?.githubUsername]);

  const ghUsername = profile?.githubUsername;

  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Github className="h-4 w-4 text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-200">GitHub</h2>
        </div>

        {ghUsername ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {ghProfile?.avatar_url && !ghLoading && (
                <img
                  src={ghProfile.avatar_url}
                  alt={ghProfile.login}
                  className="h-10 w-10 rounded-full border border-slate-700"
                />
              )}
              {ghLoading && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-950">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-100">{ghUsername}</p>
                {ghProfile && !ghLoading && (
                  <p className="font-mono text-[11px] text-slate-500">
                    {ghProfile.public_repos} repos · {ghProfile.followers} followers
                  </p>
                )}
                {ghLoading && (
                  <p className="font-mono text-[11px] text-slate-500">Loading...</p>
                )}
              </div>
            </div>
            <a
              href={`https://github.com/${ghUsername}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 py-2.5 text-xs font-medium text-slate-200 transition-all hover:border-teal-500/40 hover:text-teal-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View GitHub Profile
            </a>
            <p className="font-mono text-[10px] text-slate-600">
              GitHub activity is supporting evidence only and does not generate points.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            No GitHub username set. Add one in your profile to show your GitHub activity.
          </p>
        )}
      </div>
    </section>
  );
}
