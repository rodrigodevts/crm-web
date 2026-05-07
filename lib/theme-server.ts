import { cookies } from 'next/headers';
import type { Theme } from '@/components/theme-provider';

const COOKIE_KEY = 'theme';
const RESOLVED_COOKIE_KEY = 'theme-resolved';

function isTheme(value: string | undefined): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

export async function getThemeFromCookies(): Promise<{
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}> {
  const store = await cookies();
  const themeCookie = store.get(COOKIE_KEY)?.value;
  const resolvedCookie = store.get(RESOLVED_COOKIE_KEY)?.value;

  const theme: Theme = isTheme(themeCookie) ? themeCookie : 'system';

  let resolvedTheme: 'light' | 'dark';
  if (theme === 'light' || theme === 'dark') {
    resolvedTheme = theme;
  } else if (resolvedCookie === 'dark') {
    resolvedTheme = 'dark';
  } else {
    resolvedTheme = 'light';
  }

  return { theme, resolvedTheme };
}
