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
    <>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: 700 }}>
        Watchlist
      </h1>

      <section className="card">
        <h2>Add ticker</h2>
        <form onSubmit={handleAdd} className="flex items-center gap-1">
          <input
            type="text"
            className="input"
            value={formTicker}
            onChange={(e) => setFormTicker(e.target.value)}
            placeholder="e.g. AAPL.US"
            style={{ width: 180 }}
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Tickers</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="muted">No tickers in watchlist. Add one above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Price</th>
                  <th>Signal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.ticker}</td>
                    <td>{r.price != null ? r.price.toFixed(2) : '—'}</td>
                    <td>
                      <span className={r.signal === 'ok' ? 'text-success' : 'text-danger'}>
                        {r.signal === 'ok' ? 'ok' : 'price unavailable'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                      >
                        {deletingId === r.id ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
