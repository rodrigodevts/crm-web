'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function AppSidebarItem({
  href,
  icon: Icon,
  label,
  collapsed,
  onNavigate,
}: AppSidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        'hover:bg-bg-muted focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
        isActive
          ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 font-medium'
          : 'text-text-secondary',
        collapsed && 'justify-center',
      )}
    >
      {isActive ? (
        <span
          aria-hidden
          className="bg-primary-500 absolute top-1 bottom-1 left-0 w-0.5 rounded-r"
        />
      ) : null}
      <Icon className="h-5 w-5 shrink-0" />
      {collapsed ? null : <span className="truncate">{label}</span>}
    </Link>
  );
}
