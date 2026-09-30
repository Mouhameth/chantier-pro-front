'use client';

import { SearchProvider as SearchContextProvider } from '@/lib/contexts/SearchContext';

export function SearchProvider({ children }: { children: React.ReactNode }) {
  return <SearchContextProvider>{children}</SearchContextProvider>;
}
