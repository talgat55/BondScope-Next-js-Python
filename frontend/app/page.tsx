'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface Trade {
  id: number;
  ticker: string;
  quantity: number;
  buy_price: number;
  buy_date: string;
}

interface Bond {
  id: number;
  name: string;
  face: number;
  coupon_rate: number;
  coupon_freq: number;
  price: number;
  maturity_date: string;
}

interface TopPosition {
  name: string;
  value: number;
  type: 'stock' | 'bond';
}

const api = (path: string, options?: RequestInit) =>
  fetch(`/api${path}`, options);

export default function DashboardPage() {
  const [totalValue, setTotalValue] = useState<number>(0);
  const [stocksValue, setStocksValue] = useState<number>(0);
  const [bondsValue, setBondsValue] = useState<number>(0);
  const [topPositions, setTopPositions] = useState<TopPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [tradesRes, bondsRes] = await Promise.all([
        api('/trades'),
        api('/bonds'),
      ]);
      const trades: Trade[] = tradesRes.ok ? await tradesRes.json() : [];
      const bonds: Bond[] = bondsRes.ok ? await bondsRes.json() : [];

      const byTicker = new Map<string, number>();
      for (const t of trades) {
        byTicker.set(t.ticker, (byTicker.get(t.ticker) ?? 0) + t.quantity);
      }
      const tickers = Array.from(byTicker.keys());

      const priceMap = new Map<string, number>();
      if (tickers.length > 0) {
        const results = await Promise.all(
          tickers.map(async (ticker) => {
            try {
              const res = await api(
                `/prices?ticker=${encodeURIComponent(ticker)}`
              );
              if (!res.ok) return { ticker, price: null };
              const data: { price: number } = await res.json();
              return { ticker, price: data.price };
            } catch {
              return { ticker, price: null };
            }
          })
        );
        results.forEach((r) => {
          if (r.price != null) priceMap.set(r.ticker, r.price);
        });
      }

      let totalStocks = 0;
      const stockPositions: TopPosition[] = [];
      for (const ticker of tickers) {
        const qty = byTicker.get(ticker) ?? 0;
        const price = priceMap.get(ticker) ?? 0;
        const value = qty * price;
        totalStocks += value;
        if (value > 0) stockPositions.push({ name: ticker, value, type: 'stock' });
      }

      const totalBonds = bonds.reduce((sum, b) => sum + b.price, 0);
      const bondPositions: TopPosition[] = bonds.map((b) => ({
        name: b.name,
        value: b.price,
        type: 'bond',
      }));

      setStocksValue(totalStocks);
      setBondsValue(totalBonds);
      setTotalValue(totalStocks + totalBonds);

      const all = [...stockPositions, ...bondPositions].sort(
        (a, b) => b.value - a.value
      );
      setTopPositions(all.slice(0, 10));
    } catch (e) {
      console.error(e);
      setTotalValue(0);
      setStocksValue(0);
      setBondsValue(0);
      setTopPositions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const total = totalValue;
  const stocksPct = total > 0 ? (stocksValue / total) * 100 : 0;
  const bondsPct = total > 0 ? (bondsValue / total) * 100 : 0;

  return (
    <>
      <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
          Dashboard
        </h1>
        <Link href="/ai" className="btn btn-primary">
          AI Report
        </Link>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <section className="card">
            <h2>Total value</h2>
            <p style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {total.toFixed(2)}
            </p>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              Stocks: {stocksValue.toFixed(2)} · Bonds: {bondsValue.toFixed(2)}
            </p>
          </section>

          <section className="card">
            <h2>Allocation (stocks vs bonds)</h2>
            {total > 0 ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    height: 28,
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: 'var(--bg-elevated)',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: `${stocksPct}%`,
                      background: 'var(--accent)',
                      transition: 'width 0.2s',
                    }}
                    title={`Stocks ${stocksPct.toFixed(1)}%`}
                  />
                  <div
                    style={{
                      width: `${bondsPct}%`,
                      background: 'var(--success)',
                      transition: 'width 0.2s',
                    }}
                    title={`Bonds ${bondsPct.toFixed(1)}%`}
                  />
                </div>
                <div className="flex gap-2 muted" style={{ fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--accent)' }}>■ Stocks {stocksPct.toFixed(1)}%</span>
                  <span style={{ color: 'var(--success)' }}>■ Bonds {bondsPct.toFixed(1)}%</span>
                </div>
              </>
            ) : (
              <p className="muted">No positions. Add trades and bonds.</p>
            )}
          </section>

          <section className="card">
            <h2>Top positions</h2>
            {topPositions.length === 0 ? (
              <p className="muted">No positions yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPositions.map((p, i) => (
                      <tr key={`${p.type}-${p.name}-${i}`}>
                        <td>{p.name}</td>
                        <td>{p.type}</td>
                        <td>{p.value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
