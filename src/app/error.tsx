'use client';

import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{padding: 24}}>
      <h1>Something went wrong</h1>
      <pre style={{whiteSpace: 'pre-wrap'}}>{String(error?.message ?? 'Unknown error')}</pre>
    </main>
  );
}
