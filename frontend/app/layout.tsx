import type { Metadata } from 'next';
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
      <body>{children}</body>
    </html>
  );
}
