import { TrendingUp, Trophy, Coins, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { id: 'trending', label: 'Trending', icon: TrendingUp, path: '/' },
  { id: 'markets', label: 'Markets', icon: Coins, path: '/markets' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive ? "text-success" : "text-primary hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[12px] leading-[16px] tracking-normal font-medium text-inherit">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
