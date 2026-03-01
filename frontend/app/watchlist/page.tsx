'use client';

import { useCallback, useEffect, useState } from 'react';

interface WatchItem {
  id: number;
  ticker: string;
}

interface PriceRow {
  id: number;
  ticker: string;
  price: number | null;
  signal: 'ok' | 'price unavailable';
}

const api = (path: string, options?: RequestInit) =>
  fetch(`/api${path}`, options);

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTicker, setFormTicker] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadWatchlist = useCallback(async () => {
    try {
      const res = await api('/watchlist');
      if (!res.ok) throw new Error('Failed to load watchlist');
      const data: WatchItem[] = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Fetch current price for each ticker and build signal
  useEffect(() => {
    if (items.length === 0) {
      setRows([]);
      return;
    }
    (async () => {
      const results = await Promise.all(
        items.map(async (item) => {
          try {
            const res = await api(
              `/prices?ticker=${encodeURIComponent(item.ticker)}`
            );
            if (!res.ok) {
              return { ...item, price: null, signal: 'price unavailable' as const };
            }
            const data: { price: number } = await res.json();
            return { ...item, price: data.price, signal: 'ok' as const };
          } catch {
            return { ...item, price: null, signal: 'price unavailable' as const };
          }
        })
      );
      setRows(results);
    })();
  }, [items]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const ticker = formTicker.trim();
    if (!ticker) return;
    setSubmitting(true);
    try {
      const res = await api('/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });
      if (!res.ok) throw new Error('Failed to add');
      setFormTicker('');
      await loadWatchlist();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await api(`/watchlist/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadWatchlist();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 700 }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Watchlist</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
          Add ticker
        </h2>
        <form
          onSubmit={handleAdd}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <input
            type="text"
            value={formTicker}
            onChange={(e) => setFormTicker(e.target.value)}
            placeholder="e.g. AAPL.US"
            style={{ padding: '0.5rem 0.75rem', width: 160 }}
          />
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

      <section>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
          Tickers
        </h2>
        {loading ? (
          <p style={{ color: '#666' }}>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: '#666' }}>No tickers in watchlist. Add one above.</p>
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
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Signal</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{r.ticker}</td>
                  <td style={tdStyle}>
                    {r.price != null ? r.price.toFixed(2) : '—'}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        color: r.signal === 'ok' ? '#0a0' : '#c00',
                        fontWeight: 500,
                      }}
                    >
                      {r.signal === 'ok' ? 'ok' : 'price unavailable'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.85rem',
                        cursor: deletingId === r.id ? 'not-allowed' : 'pointer',
                        color: '#c00',
                      }}
                    >
                      {deletingId === r.id ? '…' : 'Delete'}
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
