const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const appDir = path.join(projectRoot, 'src', 'app');

const ensureDir = (p) => {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    console.log('Created directory:', p);
  }
};

const writeIfMissing = (filePath, content) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Created file:', filePath);
    return true;
  } else {
    console.log('Already exists:', filePath);
    return false;
  }
};

ensureDir(appDir);
ensureDir(path.join(appDir, 'admin'));
ensureDir(path.join(appDir, 'lib'));

// page.tsx
writeIfMissing(
  path.join(appDir, 'page.tsx'),
  `// src/app/page.tsx

export default function Home() {
  return (
    <main style={{padding: 24}}>
      <h1>Welcome to the Voting Platform</h1>
      <p>This is the root page. Add pages under <code>src/app</code> as needed.</p>
      <p>
        Go to <a href="/admin/register">Admin register</a>
      </p>
    </main>
  );
}
`
);

// globals.css
writeIfMissing(
  path.join(appDir, 'globals.css'),
  `/* src/app/globals.css */
:root { --bg: #fff; --text: #111 }
html,body,#root { height: 100%; }
body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background: var(--bg); color: var(--text); }
main { max-width: 900px; margin: 48px auto; padding: 0 16px; }
a { color: #0366d6 }
`
);

// not-found
writeIfMissing(
  path.join(appDir, 'not-found.tsx'),
  `export default function NotFound() {
  return (
    <main style={{padding: 24}}>
      <h1>404 — Not Found</h1>
      <p>The page you requested could not be found.</p>
    </main>
  );
}
`
);

// error
writeIfMissing(
  path.join(appDir, 'error.tsx'),
  `use client;

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
`
);

console.log('\nDone. If you need more pages restored, edit scripts/recreate-app.js to add them or create files under src/app.');
