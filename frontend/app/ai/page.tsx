'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ReportResponse {
  summary_md: string;
  bullets: string[];
  risks: string[];
  questions_to_check: string[];
  disclaimer: string;
}

interface ChatResponse {
  answer_md: string;
  disclaimer: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  disclaimer?: string;
}

const api = (path: string, options?: RequestInit) =>
  fetch(`/api${path}`, options);

const DISCLAIMER_TEXT =
  'This is not investment advice. For educational and informational use only.';

export default function AIPage() {
  const [tab, setTab] = useState<'report' | 'chat'>('report');
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  async function handleGenerateReport() {
    setReportError(null);
    setReport(null);
    setReportLoading(true);
    try {
      const res = await api('/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.status === 501) {
        setReportError('AI disabled: set MISTRAL_API_KEY');
        return;
      }
      if (res.status === 429) {
        setReportError('Rate limited. Try again later.');
        return;
      }
      if (res.status === 401) {
        setReportError('Invalid MISTRAL_API_KEY');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setReportError(data.detail || `Error ${res.status}`);
        return;
      }
      const data: ReportResponse = await res.json();
      setReport(data);
    } catch (e) {
      setReportError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setReportLoading(false);
    }
  }

  async function handleSendChat() {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatError(null);
    setChatMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      if (res.status === 501) {
        setChatError('AI disabled: set MISTRAL_API_KEY');
        setChatMessages((prev) => prev.slice(0, -1));
        setChatInput(msg);
        return;
      }
      if (res.status === 429) {
        setChatError('Rate limited. Try again later.');
        setChatMessages((prev) => prev.slice(0, -1));
        setChatInput(msg);
        return;
      }
      if (res.status === 401) {
        setChatError('Invalid MISTRAL_API_KEY');
        setChatMessages((prev) => prev.slice(0, -1));
        setChatInput(msg);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setChatError(data.detail || `Error ${res.status}`);
        setChatMessages((prev) => prev.slice(0, -1));
        setChatInput(msg);
        return;
      }
      const data: ChatResponse = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.answer_md, disclaimer: data.disclaimer },
      ]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : 'Request failed');
      setChatMessages((prev) => prev.slice(0, -1));
      setChatInput(msg);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.75rem', fontWeight: 700 }}>
        AI
      </h1>
      <div className="flex gap-1" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={tab === 'report' ? 'btn btn-primary' : 'btn btn-ghost'}
          onClick={() => setTab('report')}
        >
          AI Report
        </button>
        <button
          type="button"
          className={tab === 'chat' ? 'btn btn-primary' : 'btn btn-ghost'}
          onClick={() => setTab('chat')}
        >
          AI Chat
        </button>
      </div>

      <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
        {DISCLAIMER_TEXT}
      </p>

      {tab === 'report' && (
        <section className="card">
          <h2>Portfolio report</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateReport}
            disabled={reportLoading}
            style={{ marginBottom: '1rem' }}
          >
            {reportLoading ? 'Generating…' : 'Generate'}
          </button>
          {reportError && (
            <p className="text-danger" style={{ marginBottom: '0.5rem' }}>
              {reportError}
            </p>
          )}
          {report && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
                <ReactMarkdown>{report.summary_md}</ReactMarkdown>
              </div>
              {report.bullets.length > 0 && (
                <>
                  <h3 style={{ marginBottom: 0.5 }}>Bullets</h3>
                  <ul style={{ marginBottom: '1rem' }}>
                    {report.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </>
              )}
              {report.risks.length > 0 && (
                <>
                  <h3 style={{ marginBottom: 0.5 }}>Risks</h3>
                  <ul style={{ marginBottom: '1rem' }}>
                    {report.risks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </>
              )}
              {report.questions_to_check.length > 0 && (
                <>
                  <h3 style={{ marginBottom: 0.5 }}>Questions to check</h3>
                  <ul style={{ marginBottom: '1rem' }}>
                    {report.questions_to_check.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {report.disclaimer}
              </p>
            </div>
          )}
        </section>
      )}

      {tab === 'chat' && (
        <section className="card">
          <h2>Ask about your data</h2>
          {chatError && (
            <p className="text-danger" style={{ marginBottom: '0.5rem' }}>
              {chatError}
            </p>
          )}
          <div
            style={{
              marginBottom: '1rem',
              maxHeight: 400,
              overflow: 'auto',
              padding: '1rem',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            {chatMessages.length === 0 && (
              <p className="muted" style={{ fontSize: '0.9rem' }}>
                Ask a question about your portfolio, bonds, or watchlist.
              </p>
            )}
            {chatMessages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '0.75rem',
                  textAlign: m.role === 'user' ? 'right' : 'left',
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: m.role === 'user' ? 'var(--accent)' : 'var(--success)',
                  }}
                >
                  {m.role === 'user' ? 'You' : 'AI'}
                </span>
                <div
                  style={{
                    marginTop: 2,
                    padding: '0.5rem 0.75rem',
                    background: m.role === 'user' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.12)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-block',
                    maxWidth: '100%',
                    textAlign: 'left',
                  }}
                >
                  {m.role === 'assistant' ? (
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>
                  )}
                </div>
                {m.disclaimer && (
                  <p className="muted" style={{ fontSize: '0.8rem', marginTop: 4, marginBottom: 0 }}>
                    {m.disclaimer}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-1" style={{ alignItems: 'flex-end' }}>
            <textarea
              className="input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              placeholder="Your question..."
              rows={2}
              style={{ flex: 1, resize: 'vertical' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
            >
              {chatLoading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
