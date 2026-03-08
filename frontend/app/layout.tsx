import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'BondScope',
  description: 'Bond and equity portfolio dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
        />
      </head>
      <body>
        <nav className="app-nav">
          <Link href="/" className="brand">
            BondScope
          </Link>
          <Link href="/">Dashboard</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/bonds">Bonds</Link>
          <Link href="/watchlist">Watchlist</Link>
          <Link href="/ai">AI</Link>
        </nav>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
