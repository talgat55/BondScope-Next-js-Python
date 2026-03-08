'use client';

import { useCallback, useEffect, useState } from 'react';

interface Bond {
  id: number;
  name: string;
  face: number;
  coupon_rate: number;
  coupon_freq: number;
  price: number;
  maturity_date: string;
}

interface BondMetrics {
  ytm: number;
  current_yield: number;
  duration: number;
  cashflows: { date: string; amount: number }[];
}

const api = (path: string, options?: RequestInit) =>
  fetch(`/api${path}`, options);

export default function BondsPage() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<BondMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    face: '1000',
    coupon_rate: '5',
    coupon_freq: '2',
    price: '98',
    maturity_date: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);

  const loadBonds = useCallback(async () => {
    try {
      const res = await api('/bonds');
      if (!res.ok) throw new Error('Failed to load bonds');
      const data: Bond[] = await res.json();
      setBonds(data);
    } catch (e) {
      console.error(e);
      setBonds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBonds();
  }, [loadBonds]);

  useEffect(() => {
    if (selectedId == null) {
      setMetrics(null);
      return;
    }
    setMetricsLoading(true);
    setMetrics(null);
    api(`/bonds/${selectedId}/metrics`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load metrics');
        return res.json();
      })
      .then((data: BondMetrics) => setMetrics(data))
      .catch(() => setMetrics(null))
      .finally(() => setMetricsLoading(false));
  }, [selectedId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const face = parseFloat(form.face);
    const coupon_rate = parseFloat(form.coupon_rate) / 100;
    const coupon_freq = parseInt(form.coupon_freq, 10);
    const price = parseFloat(form.price);
    if (
      !form.name.trim() ||
      isNaN(face) ||
      face <= 0 ||
      isNaN(coupon_freq) ||
      coupon_freq < 1 ||
      isNaN(price) ||
      price <= 0
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await api('/bonds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          face,
          coupon_rate,
          coupon_freq,
          price,
          maturity_date: form.maturity_date,
        }),
      });
      if (!res.ok) throw new Error('Failed to add bond');
      setForm((f) => ({ ...f, name: '' }));
      await loadBonds();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedBond = selectedId != null ? bonds.find((b) => b.id === selectedId) : null;

  return (
    <>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: 700 }}>
        Bonds
      </h1>

      <section className="card">
        <h2>Add bond</h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-2"
          style={{ alignItems: 'flex-end', maxWidth: 720 }}
        >
          <label style={{ minWidth: 140 }}>
            Name
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Bond name"
            />
          </label>
          <label style={{ width: 90 }}>
            Face
            <input
              type="number"
              className="input"
              min="0.01"
              step="any"
              value={form.face}
              onChange={(e) => setForm((f) => ({ ...f, face: e.target.value }))}
            />
          </label>
          <label style={{ width: 100 }}>
            Coupon %
            <input
              type="number"
              className="input"
              min="0"
              step="0.01"
              value={form.coupon_rate}
              onChange={(e) =>
                setForm((f) => ({ ...f, coupon_rate: e.target.value }))
              }
            />
          </label>
          <label style={{ width: 80 }}>
            Freq
            <input
              type="number"
              className="input"
              min="1"
              max="12"
              value={form.coupon_freq}
              onChange={(e) =>
                setForm((f) => ({ ...f, coupon_freq: e.target.value }))
              }
            />
          </label>
          <label style={{ width: 80 }}>
            Price
            <input
              type="number"
              className="input"
              min="0.01"
              step="any"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </label>
          <label style={{ width: 140 }}>
            Maturity
            <input
              type="date"
              className="input"
              value={form.maturity_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, maturity_date: e.target.value }))
              }
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Bonds</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : bonds.length === 0 ? (
          <p className="muted">No bonds yet. Add one above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Face</th>
                  <th>Coupon %</th>
                  <th>Freq</th>
                  <th>Price</th>
                  <th>Maturity</th>
                </tr>
              </thead>
              <tbody>
                {bonds.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    className={selectedId === b.id ? 'selected' : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{b.name}</td>
                    <td>{b.face}</td>
                    <td>{(b.coupon_rate * 100).toFixed(2)}</td>
                    <td>{b.coupon_freq}</td>
                    <td>{b.price.toFixed(2)}</td>
                    <td>{b.maturity_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedBond && (
        <section className="card">
          <h2>Metrics: {selectedBond.name}</h2>
          {metricsLoading ? (
            <p className="muted">Loading metrics…</p>
          ) : metrics ? (
            <>
              <div className="flex flex-wrap gap-2" style={{ marginBottom: '1rem' }}>
                <span><strong>YTM:</strong> {(metrics.ytm * 100).toFixed(2)}%</span>
                <span><strong>Current yield:</strong> {(metrics.current_yield * 100).toFixed(2)}%</span>
                <span><strong>Duration:</strong> {metrics.duration.toFixed(4)} yrs</span>
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Cashflows</h3>
              <div className="table-wrap" style={{ maxWidth: 400 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.cashflows.map((cf, i) => (
                      <tr key={i}>
                        <td>{cf.date}</td>
                        <td>{cf.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="muted">Could not load metrics.</p>
          )}
        </section>
      )}
    </>
  );
}
