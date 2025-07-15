'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    const errorData = await res.json().catch(() => ({}));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).info = errorData;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).status = res.status;
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
