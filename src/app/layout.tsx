import type { Metadata } from "next";
import "./globals.css"; // Ensure your styles are imported

export const metadata: Metadata = {
  title: "SafeVote - Secure Voting for Organizations",
  description: "Secure, modern, and transparent voting platform for schools, NGOs, corporations, and community groups.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body suppressHydrationWarning>
        {/* Everything from your pages will appear here */}
        {children}
      </body>
    </html>
  );
}

