import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        padding: '2rem',
        maxWidth: 500,
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h1 style={{ marginBottom: '0.5rem' }}>404</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Page not found.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.5rem 1rem',
          background: '#2563eb',
          color: '#fff',
          borderRadius: 6,
          textDecoration: 'none',
        }}
      >
        Back to Dashboard
      </Link>
    </main>
  );
}
