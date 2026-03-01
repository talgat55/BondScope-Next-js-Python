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
    <main style={{ padding: '2rem', maxWidth: 900 }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Bonds</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
          Add bond
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.75rem',
            alignItems: 'flex-end',
            maxWidth: 700,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Bond name"
              style={{ padding: '0.4rem 0.6rem' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Face
            <input
              type="number"
              min="0.01"
              step="any"
              value={form.face}
              onChange={(e) => setForm((f) => ({ ...f, face: e.target.value }))}
              style={{ padding: '0.4rem 0.6rem' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Coupon % (e.g. 5)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.coupon_rate}
              onChange={(e) =>
                setForm((f) => ({ ...f, coupon_rate: e.target.value }))
              }
              style={{ padding: '0.4rem 0.6rem' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Freq (1/2/4/12)
            <input
              type="number"
              min="1"
              max="12"
              value={form.coupon_freq}
              onChange={(e) =>
                setForm((f) => ({ ...f, coupon_freq: e.target.value }))
              }
              style={{ padding: '0.4rem 0.6rem' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Price
            <input
              type="number"
              min="0.01"
              step="any"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              style={{ padding: '0.4rem 0.6rem' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Maturity date
            <input
              type="date"
              value={form.maturity_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, maturity_date: e.target.value }))
              }
              style={{ padding: '0.4rem 0.6rem' }}
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

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
          Bonds
        </h2>
        {loading ? (
          <p style={{ color: '#666' }}>Loading…</p>
        ) : bonds.length === 0 ? (
          <p style={{ color: '#666' }}>No bonds yet. Add one above.</p>
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
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Face</th>
                <th style={thStyle}>Coupon %</th>
                <th style={thStyle}>Freq</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Maturity</th>
              </tr>
            </thead>
            <tbody>
              {bonds.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  style={{
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    background: selectedId === b.id ? '#e8f4ff' : undefined,
                  }}
                >
                  <td style={tdStyle}>{b.name}</td>
                  <td style={tdStyle}>{b.face}</td>
                  <td style={tdStyle}>{(b.coupon_rate * 100).toFixed(2)}</td>
                  <td style={tdStyle}>{b.coupon_freq}</td>
                  <td style={tdStyle}>{b.price.toFixed(2)}</td>
                  <td style={tdStyle}>{b.maturity_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selectedBond && (
        <section
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: 8,
            border: '1px solid #dee2e6',
          }}
        >
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
            Metrics: {selectedBond.name}
          </h2>
          {metricsLoading ? (
            <p style={{ color: '#666' }}>Loading metrics…</p>
          ) : metrics ? (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <strong>YTM:</strong>{' '}
                  {(metrics.ytm * 100).toFixed(2)}%
                </div>
                <div>
                  <strong>Current yield:</strong>{' '}
                  {(metrics.current_yield * 100).toFixed(2)}%
                </div>
                <div>
                  <strong>Duration:</strong>{' '}
                  {metrics.duration.toFixed(4)} yrs
                </div>
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
                Cashflows
              </h3>
              <table
                style={{
                  width: '100%',
                  maxWidth: 400,
                  borderCollapse: 'collapse',
                  background: '#fff',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <thead>
                  <tr style={{ background: '#eee', textAlign: 'left' }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.cashflows.map((cf, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: '1px solid #eee' }}
                    >
                      <td style={tdStyle}>{cf.date}</td>
                      <td style={tdStyle}>{cf.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p style={{ color: '#666' }}>Could not load metrics.</p>
          )}
        </section>
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
