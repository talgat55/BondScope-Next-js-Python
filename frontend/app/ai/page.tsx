'use client';

import { useState } from 'react';

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
    <main style={{ padding: '2rem', maxWidth: 800 }}>
      <h1 style={{ marginBottom: '1rem' }}>AI</h1>
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setTab('report')}
          style={{
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: tab === 'report' ? 600 : 400,
            background: tab === 'report' ? '#eee' : 'transparent',
            border: '1px solid #ccc',
            borderRadius: 6,
          }}
        >
          AI Report
        </button>
        <button
          type="button"
          onClick={() => setTab('chat')}
          style={{
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: tab === 'chat' ? 600 : 400,
            background: tab === 'chat' ? '#eee' : 'transparent',
            border: '1px solid #ccc',
            borderRadius: 6,
          }}
        >
          AI Chat
        </button>
      </div>

      <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
        {DISCLAIMER_TEXT}
      </p>

      {tab === 'report' && (
        <section>
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
            Portfolio report
          </h2>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={reportLoading}
            style={{
              padding: '0.5rem 1rem',
              marginBottom: '1rem',
              cursor: reportLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {reportLoading ? 'Generating…' : 'Generate'}
          </button>
          {reportError && (
            <p style={{ color: '#c00', marginBottom: '0.5rem' }}>
              {reportError}
            </p>
          )}
          {report && (
            <div
              style={{
                padding: '1rem',
                background: '#fafafa',
                borderRadius: 8,
                border: '1px solid #eee',
              }}
            >
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  marginBottom: '1rem',
                  lineHeight: 1.5,
                }}
              >
                {report.summary_md}
              </div>
              {report.bullets.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', marginBottom: 0.5 }}>Bullets</h3>
                  <ul style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
                    {report.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </>
              )}
              {report.risks.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', marginBottom: 0.5 }}>Risks</h3>
                  <ul style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
                    {report.risks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </>
              )}
              {report.questions_to_check.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', marginBottom: 0.5 }}>
                    Questions to check
                  </h3>
                  <ul style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
                    {report.questions_to_check.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </>
              )}
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                {report.disclaimer}
              </p>
            </div>
          )}
        </section>
      )}

      {tab === 'chat' && (
        <section>
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
            Ask about your data
          </h2>
          {chatError && (
            <p style={{ color: '#c00', marginBottom: '0.5rem' }}>{chatError}</p>
          )}
          <div
            style={{
              marginBottom: '1rem',
              maxHeight: 400,
              overflow: 'auto',
              padding: '0.75rem',
              background: '#f9f9f9',
              borderRadius: 8,
              border: '1px solid #eee',
            }}
          >
            {chatMessages.length === 0 && (
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
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
                    color: m.role === 'user' ? '#2563eb' : '#059669',
                  }}
                >
                  {m.role === 'user' ? 'You' : 'AI'}
                </span>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    marginTop: 2,
                    padding: '0.5rem',
                    background: m.role === 'user' ? '#e8f4ff' : '#f0fdf4',
                    borderRadius: 6,
                    display: 'inline-block',
                    maxWidth: '100%',
                  }}
                >
                  {m.text}
                </div>
                {m.disclaimer && (
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: '#666',
                      marginTop: 4,
                      marginBottom: 0,
                    }}
                  >
                    {m.disclaimer}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <textarea
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
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                resize: 'vertical',
              }}
            />
            <button
              type="button"
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                padding: '0.5rem 1rem',
                cursor:
                  chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {chatLoading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
