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
      <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem', fontWeight: 700 }}>
        404
      </h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        Page not found.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to Dashboard
      </Link>
    </main>
  );
}
