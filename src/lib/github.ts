/**
 * Unauthenticated GitHub REST API helpers.
 * Used only as supporting evidence in the Perform tab.
 * GitHub activity never generates points.
 */

export interface GitHubProfile {
  login: string;
  html_url: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  bio: string | null;
}

export async function fetchGitHubProfile(
  username: string,
): Promise<GitHubProfile | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      login: data.login,
      html_url: data.html_url,
      avatar_url: data.avatar_url,
      public_repos: data.public_repos ?? 0,
      followers: data.followers ?? 0,
      bio: data.bio ?? null,
    };
  } catch {
    return null;
  }
}
