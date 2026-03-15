'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, ChefHat, FileDown, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: "Aujourd'hui", icon: Home },
  { href: '/semainier', label: 'Semainier', icon: CalendarDays },
  { href: '/batch-cook', label: 'Batch Cook', icon: ChefHat },
  { href: '/export', label: 'Export', icon: FileDown },
  { href: '/settings', label: 'Réglages', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-sm safe-area-pb"
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
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
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
