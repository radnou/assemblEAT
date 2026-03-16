'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, ChefHat, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navRoutes = [
  { href: '/app', key: 'dashboard', icon: Home, label: 'Accueil' },
  { href: '/app/semainier', key: 'weekPlanner', icon: CalendarDays, label: 'Semainier' },
  { href: '/app/batch-cook', key: 'batchCook', icon: ChefHat, label: 'Préparer' },
  { href: '/app/settings', key: 'settings', icon: Settings, label: 'Réglages' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-sm safe-area-pb"
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-around h-16">
        {navRoutes.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/app' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
                isActive
                  ? 'text-[var(--color-cta)]'
                  : 'text-gray-500 hover:text-gray-600'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={label}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
