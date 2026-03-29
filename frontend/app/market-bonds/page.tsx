'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';

interface MarketBondRow {
  id: number;
  name: string;
  ticker: string | null;
  face: number;
  coupon_rate: number;
  coupon_freq: number;
  maturity_date: string;
  price: number;
  ytm: number | null;
  current_yield: number | null;
  duration: number | null;
}

const api = (path: string, options?: RequestInit) =>
  fetch(`/api${path}`, options);

/** ISO YYYY-MM-DD → DD.MM.YYYY */
function formatMaturityDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export type MarketBondSource = 'rf' | 'intl';

export default function MarketBondsPage() {
  const { t } = useLocale();
  const [source, setSource] = useState<MarketBondSource>('intl');
  const [rows, setRows] = useState<MarketBondRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ source });
      const res = await api(`/market-bonds?${q.toString()}`);
      if (!res.ok) throw new Error('Failed to load market bonds');
      const data: MarketBondRow[] = await res.json();
      setRows(data);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: 700 }}>
        {t.marketBonds.title}
      </h1>
      <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
        {t.marketBonds.description}
      </p>

      <div
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          {t.marketBonds.sourceLabel}
        </span>
        <div className="lang-switcher" style={{ marginLeft: 0 }}>
          <button
            type="button"
            className={source === 'rf' ? 'btn btn-ghost active' : 'btn btn-ghost'}
            onClick={() => setSource('rf')}
            aria-pressed={source === 'rf'}
          >
            {t.marketBonds.sourceRf}
          </button>
          <button
            type="button"
            className={source === 'intl' ? 'btn btn-ghost active' : 'btn btn-ghost'}
            onClick={() => setSource('intl')}
            aria-pressed={source === 'intl'}
          >
            {t.marketBonds.sourceIntl}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="muted">{t.marketBonds.loading}</p>
      ) : rows.length === 0 ? (
        <p className="muted">{t.marketBonds.noData}</p>
      ) : (
        <section className="card">
          <div className="table-wrap market-bonds-table">
            <table>
              <thead>
                <tr>
                  <th>{t.bonds.name}</th>
                  <th>{t.bonds.face}</th>
                  <th>{t.bonds.couponPct}</th>
                  <th>{t.bonds.freq}</th>
                  <th>{t.bonds.price}</th>
                  <th>{t.bonds.maturity}</th>
                  <th>{t.bonds.ytm}</th>
                  <th>{t.bonds.currentYield}</th>
                  <th>{t.bonds.duration}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.face}</td>
                    <td>{(r.coupon_rate * 100).toFixed(2)}%</td>
                    <td>{r.coupon_freq}</td>
                    <td>{r.price.toFixed(2)}</td>
                    <td>{formatMaturityDate(r.maturity_date)}</td>
                    <td>
                      {r.ytm != null ? `${(r.ytm * 100).toFixed(2)}%` : '—'}
                    </td>
                    <td>
                      {r.current_yield != null
                        ? `${(r.current_yield * 100).toFixed(2)}%`
                        : '—'}
                    </td>
                    <td>
                      {r.duration != null
                        ? `${r.duration.toFixed(2)} ${t.bonds.durationYrs}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
