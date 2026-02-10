import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeVote",
  description: "Secure voting platform",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/logo.png" type="image/png" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Initialize theme immediately to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('sv-theme');
                  const theme = savedTheme || 'system';
                  
                  if (theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else if (theme === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    // system preference
                    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                      document.documentElement.setAttribute('data-theme', 'light');
                    }
                  }
                  
                  const savedAccent = localStorage.getItem('sv-accent') || 'emerald';
                  document.documentElement.setAttribute('data-accent', savedAccent);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

