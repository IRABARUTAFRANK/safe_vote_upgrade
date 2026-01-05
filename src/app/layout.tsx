import type { Metadata } from "next";
import "./globals.css"; // Ensure your styles are imported

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<<<<<<< HEAD
    <html lang="en" suppressHydrationWarning>
=======
    <html lang="en">
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
<<<<<<< HEAD
      <body suppressHydrationWarning>
=======
      <body>
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
        {/* Everything from your pages will appear here */}
        {children}
      </body>
    </html>
  );
}