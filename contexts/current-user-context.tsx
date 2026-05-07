'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';

const CurrentUserContext = createContext<UserResponseDto | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: UserResponseDto;
  children: ReactNode;
}) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): UserResponseDto {
  const user = useContext(CurrentUserContext);
  if (!user) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  }
  return user;
}
