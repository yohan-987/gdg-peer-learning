import { NavLink } from 'react-router-dom';
import { LayoutDashboard, HelpCircle, Trophy, Users, User } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/doubts', label: 'Doubts', icon: HelpCircle },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/leaderboard', label: 'Ranks', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
      <div className="flex items-stretch justify-around px-2 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 transition-colors ${
                  isActive
                    ? 'text-teal-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
