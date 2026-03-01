'use client';

import { useCallback, useEffect, useState } from 'react';

interface Trade {
  id: number;
  ticker: string;
  quantity: number;
  buy_price: number;
  buy_date: string;
}

interface Position {
  ticker: string;
  totalQty: number;
  avgCost: number;
  totalCost: number;
  currentPrice: number | null;
  pnl: number | null;
}

const api = (path: string, options?: RequestInit) =>
  fetch(`/api${path}`, options);

export default function PortfolioPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    ticker: '',
    quantity: '',
    buy_price: '',
    buy_date: new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadTrades = useCallback(async () => {
    try {
      const res = await api('/trades');
      if (!res.ok) throw new Error('Failed to load trades');
      const data: Trade[] = await res.json();
      setTrades(data);
    } catch (e) {
      console.error(e);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  // Aggregate positions and fetch current prices
  useEffect(() => {
    if (trades.length === 0) {
      setPositions([]);
      return;
    }
    const byTicker = new Map<string, { totalQty: number; totalCost: number }>();
    for (const t of trades) {
      const cur = byTicker.get(t.ticker) ?? { totalQty: 0, totalCost: 0 };
      cur.totalQty += t.quantity;
      cur.totalCost += t.quantity * t.buy_price;
      byTicker.set(t.ticker, cur);
    }
    const tickers = Array.from(byTicker.keys());
    const positionsWithPrices: Position[] = tickers.map((ticker) => {
      const { totalQty, totalCost } = byTicker.get(ticker)!;
      return {
        ticker,
        totalQty,
        totalCost,
        avgCost: totalCost / totalQty,
        currentPrice: null,
        pnl: null,
      };
    });
    setPositions(positionsWithPrices);

    (async () => {
      const results = await Promise.all(
        tickers.map(async (ticker) => {
          try {
            const res = await api(`/prices?ticker=${encodeURIComponent(ticker)}`);
            if (!res.ok) return { ticker, price: null };
            const data: { price: number } = await res.json();
            return { ticker, price: data.price };
          } catch {
            return { ticker, price: null };
          }
        })
      );
      setPositions((prev) =>
        prev.map((p) => {
          const r = results.find((x) => x.ticker === p.ticker);
          const currentPrice = r?.price ?? null;
          const pnl =
            currentPrice != null
              ? (currentPrice - p.avgCost) * p.totalQty
              : null;
          return { ...p, currentPrice, pnl };
        })
      );
    })();
  }, [trades]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(form.quantity);
    const buy_price = parseFloat(form.buy_price);
    if (!form.ticker.trim() || isNaN(qty) || qty <= 0 || isNaN(buy_price) || buy_price <= 0) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await api('/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: form.ticker.trim(),
          quantity: qty,
          buy_price,
          buy_date: form.buy_date,
        }),
      });
      if (!res.ok) throw new Error('Failed to add trade');
      setForm((f) => ({ ...f, ticker: '', quantity: '', buy_price: '' }));
      await loadTrades();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await api(`/trades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadTrades();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 900 }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Portfolio</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
          Add trade
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'flex-end',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Ticker
            <input
              type="text"
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
              placeholder="e.g. AAPL.US"
              style={{ padding: '0.4rem 0.6rem', width: 120 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Qty
            <input
              type="number"
              min="0.0001"
              step="any"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              style={{ padding: '0.4rem 0.6rem', width: 90 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Buy price
            <input
              type="number"
              min="0.0001"
              step="any"
              value={form.buy_price}
              onChange={(e) =>
                setForm((f) => ({ ...f, buy_price: e.target.value }))
              }
              style={{ padding: '0.4rem 0.6rem', width: 90 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Buy date
            <input
              type="date"
              value={form.buy_date}
              onChange={(e) => setForm((f) => ({ ...f, buy_date: e.target.value }))}
              style={{ padding: '0.4rem 0.6rem', width: 140 }}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.5rem 1rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </form>
      </section>

      {positions.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
            Positions (by ticker)
          </h2>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: '#fafafa',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr style={{ background: '#eee', textAlign: 'left' }}>
                <th style={thStyle}>Ticker</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Avg cost</th>
                <th style={thStyle}>Current price</th>
                <th style={thStyle}>P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.ticker} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{p.ticker}</td>
                  <td style={tdStyle}>{p.totalQty}</td>
                  <td style={tdStyle}>{p.avgCost.toFixed(2)}</td>
                  <td style={tdStyle}>
                    {p.currentPrice != null
                      ? p.currentPrice.toFixed(2)
                      : '—'}
                  </td>
                  <td style={tdStyle}>
                    {p.pnl != null ? (
                      <span
                        style={{
                          color: p.pnl >= 0 ? '#0a0' : '#c00',
                        }}
                      >
                        {p.pnl >= 0 ? '+' : ''}
                        {p.pnl.toFixed(2)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
          Trades
        </h2>
        {loading ? (
          <p style={{ color: '#666' }}>Loading…</p>
        ) : trades.length === 0 ? (
          <p style={{ color: '#666' }}>No trades yet. Add one above.</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: '#fafafa',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr style={{ background: '#eee', textAlign: 'left' }}>
                <th style={thStyle}>Ticker</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Buy price</th>
                <th style={thStyle}>Buy date</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{t.ticker}</td>
                  <td style={tdStyle}>{t.quantity}</td>
                  <td style={tdStyle}>{t.buy_price.toFixed(2)}</td>
                  <td style={tdStyle}>{t.buy_date}</td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.85rem',
                        cursor: deletingId === t.id ? 'not-allowed' : 'pointer',
                        color: '#c00',
                      }}
                    >
                      {deletingId === t.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
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
