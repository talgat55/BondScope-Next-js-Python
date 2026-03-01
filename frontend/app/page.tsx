'use client';

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

      // Aggregate stock positions by ticker
      const byTicker = new Map<string, number>();
      for (const t of trades) {
        byTicker.set(t.ticker, (byTicker.get(t.ticker) ?? 0) + t.quantity);
      }
      const tickers = Array.from(byTicker.keys());

      // Fetch current prices for stock tickers
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

      // Stock values: qty * current price (or 0 if no price)
      let totalStocks = 0;
      const stockPositions: TopPosition[] = [];
      for (const ticker of tickers) {
        const qty = byTicker.get(ticker) ?? 0;
        const price = priceMap.get(ticker) ?? 0;
        const value = qty * price;
        totalStocks += value;
        if (value > 0) stockPositions.push({ name: ticker, value, type: 'stock' });
      }

      // Bond values: use entered price per bond
      const totalBonds = bonds.reduce((sum, b) => sum + b.price, 0);
      const bondPositions: TopPosition[] = bonds.map((b) => ({
        name: b.name,
        value: b.price,
        type: 'bond',
      }));

      setStocksValue(totalStocks);
      setBondsValue(totalBonds);
      setTotalValue(totalStocks + totalBonds);

      // Top positions by value (desc)
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
    <main style={{ padding: '2rem', maxWidth: 800 }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Dashboard</h1>

      {loading ? (
        <p style={{ color: '#666' }}>Loading…</p>
      ) : (
        <>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              Total value
            </h2>
            <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {total.toFixed(2)}
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Stocks: {stocksValue.toFixed(2)} · Bonds: {bondsValue.toFixed(2)}
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
              Allocation (stocks vs bonds)
            </h2>
            {total > 0 ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    height: 28,
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: '#eee',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      width: `${stocksPct}%`,
                      background: '#2563eb',
                      transition: 'width 0.2s',
                    }}
                    title={`Stocks ${stocksPct.toFixed(1)}%`}
                  />
                  <div
                    style={{
                      width: `${bondsPct}%`,
                      background: '#059669',
                      transition: 'width 0.2s',
                    }}
                    title={`Bonds ${bondsPct.toFixed(1)}%`}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#2563eb' }}>■ Stocks {stocksPct.toFixed(1)}%</span>
                  <span style={{ color: '#059669' }}>■ Bonds {bondsPct.toFixed(1)}%</span>
                </div>
              </>
            ) : (
              <p style={{ color: '#666' }}>No positions. Add trades and bonds.</p>
            )}
          </section>

          <section>
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
              Top positions
            </h2>
            {topPositions.length === 0 ? (
              <p style={{ color: '#666' }}>No positions yet.</p>
            ) : (
              <table
                style={{
                  width: '100%',
                  maxWidth: 400,
                  borderCollapse: 'collapse',
                  background: '#fafafa',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <thead>
                  <tr style={{ background: '#eee', textAlign: 'left' }}>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {topPositions.map((p, i) => (
                    <tr
                      key={`${p.type}-${p.name}-${i}`}
                      style={{ borderBottom: '1px solid #eee' }}
                    >
                      <td style={tdStyle}>{p.name}</td>
                      <td style={tdStyle}>{p.type}</td>
                      <td style={tdStyle}>{p.value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  fontWeight: 600,
};
const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
};
