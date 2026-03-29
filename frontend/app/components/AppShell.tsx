'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '../i18n/LocaleContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();
  const wideMain = pathname?.startsWith('/market-bonds') ?? false;

  return (
    <>
      <nav className="app-nav">
        <Link href="/" className="brand">
          BondScope
        </Link>
        <Link href="/">{t.nav.dashboard}</Link>
        <Link href="/portfolio">{t.nav.portfolio}</Link>
        <Link href="/bonds">{t.nav.bonds}</Link>
        <Link href="/market-bonds">{t.nav.marketBonds}</Link>
        <Link href="/watchlist">{t.nav.watchlist}</Link>
        <Link href="/ai">{t.nav.ai}</Link>
        <div className="lang-switcher">
          <button
            type="button"
            className={locale === 'ru' ? 'btn btn-ghost active' : 'btn btn-ghost'}
            onClick={() => setLocale('ru')}
            aria-pressed={locale === 'ru'}
          >
            RU
          </button>
          <button
            type="button"
            className={locale === 'en' ? 'btn btn-ghost active' : 'btn btn-ghost'}
            onClick={() => setLocale('en')}
            aria-pressed={locale === 'en'}
          >
            EN
          </button>
        </div>
      </nav>
      <main className={wideMain ? 'app-main app-main--wide' : 'app-main'}>{children}</main>
    </>
  );
}
