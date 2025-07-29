'use client';

import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    const errorData = await res.json().catch(() => ({}));

    (error as Error & { info?: unknown; status?: number }).info = errorData;
    (error as Error & { info?: unknown; status?: number }).status = res.status;
    throw error;
  }

  return res.json();
};
interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        shouldRetryOnError: error => {
          // Don't retry on 4xx errors (client errors)
          return error.status >= 500;
        },
        onError: (error, key) => {
          console.error('SWR Error:', { error, key });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
