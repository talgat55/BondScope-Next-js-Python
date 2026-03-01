'use client';

import { useState } from 'react';

interface HealthResponse {
  ok: boolean;
}

export default function DashboardPage() {
  const [result, setResult] = useState<HealthResponse | string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkApi() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/health');
      const data: HealthResponse = await res.json();
      setResult(data);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 600 }}>
      <h1 style={{ marginBottom: '1rem' }}>Dashboard</h1>
      <button
        type="button"
        onClick={checkApi}
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          fontSize: 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Checking…' : 'Check API'}
      </button>
      {result !== null && (
        <pre
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: 8,
            overflow: 'auto',
          }}
        >
          {typeof result === 'string'
            ? result
            : JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
