import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'BondScope',
  description: 'Bond and equity portfolio dashboard',
};

const navStyle = {
  display: 'flex' as const,
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  background: '#f5f5f5',
  borderBottom: '1px solid #eee',
  marginBottom: 0,
};
const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none' as const,
  fontSize: '0.9rem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav style={navStyle}>
          <Link href="/" style={linkStyle}>Dashboard</Link>
          <Link href="/portfolio" style={linkStyle}>Portfolio</Link>
          <Link href="/bonds" style={linkStyle}>Bonds</Link>
          <Link href="/watchlist" style={linkStyle}>Watchlist</Link>
          <Link href="/ai" style={linkStyle}>AI</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
