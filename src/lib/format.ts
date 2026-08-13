/** "2h ago" style relative timestamps for reply/doubt cards. */
export function timeAgo(ms: number): string {
  if (!ms) return 'just now';
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

const AVATAR_COLORS = [
  'bg-teal-500/20 text-teal-300',
  'bg-amber-500/20 text-amber-300',
  'bg-sky-500/20 text-sky-300',
  'bg-violet-500/20 text-violet-300',
  'bg-rose-500/20 text-rose-300',
  'bg-lime-500/20 text-lime-300',
];

/** Deterministic avatar color per user, based on a simple hash of their id. */
export function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[Math.abs(hash)];
}
