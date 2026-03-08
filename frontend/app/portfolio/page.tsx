'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';

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
  const { t } = useLocale();
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
    <>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: 700 }}>
        {t.portfolio.title}
      </h1>

      <section className="card">
        <h2>{t.portfolio.addTrade}</h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-2"
          style={{ alignItems: 'flex-end' }}
        >
          <label style={{ width: 120 }}>
            {t.portfolio.ticker}
            <input
              type="text"
              className="input"
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
              placeholder="AAPL.US"
            />
          </label>
          <label style={{ width: 90 }}>
            {t.portfolio.qty}
            <input
              type="number"
              className="input"
              min="0.0001"
              step="any"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
          </label>
          <label style={{ width: 90 }}>
            {t.portfolio.buyPrice}
            <input
              type="number"
              className="input"
              min="0.0001"
              step="any"
              value={form.buy_price}
              onChange={(e) => setForm((f) => ({ ...f, buy_price: e.target.value }))}
            />
          </label>
          <label style={{ width: 140 }}>
            {t.portfolio.buyDate}
            <input
              type="date"
              className="input"
              value={form.buy_date}
              onChange={(e) => setForm((f) => ({ ...f, buy_date: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? t.portfolio.adding : t.portfolio.add}
          </button>
        </form>
      </section>

      {positions.length > 0 && (
        <section className="card">
          <h2>{t.portfolio.positionsByTicker}</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.portfolio.ticker}</th>
                  <th>{t.portfolio.qty}</th>
                  <th>{t.portfolio.avgCost}</th>
                  <th>{t.portfolio.currentPrice}</th>
                  <th>{t.portfolio.pnl}</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.ticker}>
                    <td>{p.ticker}</td>
                    <td>{p.totalQty}</td>
                    <td>{p.avgCost.toFixed(2)}</td>
                    <td>{p.currentPrice != null ? p.currentPrice.toFixed(2) : '—'}</td>
                    <td>
                      {p.pnl != null ? (
                        <span className={p.pnl >= 0 ? 'text-success' : 'text-danger'}>
                          {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card">
        <h2>{t.portfolio.trades}</h2>
        {loading ? (
          <p className="muted">{t.portfolio.loading}</p>
        ) : trades.length === 0 ? (
          <p className="muted">{t.portfolio.noTradesYet}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.portfolio.ticker}</th>
                  <th>{t.portfolio.qty}</th>
                  <th>{t.portfolio.buyPrice}</th>
                  <th>{t.portfolio.date}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trades.map((tr) => (
                  <tr key={tr.id}>
                    <td>{tr.ticker}</td>
                    <td>{tr.quantity}</td>
                    <td>{tr.buy_price.toFixed(2)}</td>
                    <td>{tr.buy_date}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(tr.id)}
                        disabled={deletingId === tr.id}
                      >
                        {deletingId === tr.id ? '…' : t.portfolio.delete}
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
