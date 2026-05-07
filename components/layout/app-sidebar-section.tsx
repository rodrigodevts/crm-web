'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarSubItem {
  href: string;
  label: string;
}

interface AppSidebarSectionProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  items: SidebarSubItem[];
  onNavigate?: () => void;
}

export function AppSidebarSection({
  href,
  icon: Icon,
  label,
  collapsed,
  items,
  onNavigate,
}: AppSidebarSectionProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const [open, setOpen] = useState(isActive);

  if (collapsed) {
    return (
      <Link
        href={href}
        title={label}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center justify-center rounded-md px-3 py-2 text-sm',
          'hover:bg-bg-muted focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
          isActive
            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
            : 'text-text-secondary',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`sidebar-section-${label}`}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          'hover:bg-bg-muted focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
          isActive
            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 font-medium'
            : 'text-text-secondary',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? (
        <ul id={`sidebar-section-${label}`} className="mt-1 ml-7 space-y-0.5">
          {items.map((sub) => {
            const subActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
            return (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  onClick={onNavigate}
                  aria-current={subActive ? 'page' : undefined}
                  className={cn(
                    'block rounded-md px-3 py-1.5 text-sm transition-colors',
                    'hover:bg-bg-muted focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
                    subActive ? 'text-primary-600 font-medium' : 'text-text-secondary',
                  )}
                >
                  {sub.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
