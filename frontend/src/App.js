import React, { useState } from 'react';
import styled from './App.module.css';
import EmailForm from './components/EmailForm';
import ResultPanel from './components/ResultPanel';
import Header from './components/Header';
import HistoryPanel from './components/HistoryPanel';

const SAMPLE_EMAILS = [
  {
    label: "😡 Angry Refund",
    data: {
      from_email: "john.doe@gmail.com",
      customer_name: "John Doe",
      subject: "I want my money back NOW — order completely wrong",
      body: "This is absolutely unacceptable. I ordered a premium subscription 3 weeks ago and still haven't received access. I've sent 4 emails with zero response. I want a FULL REFUND immediately or I'm disputing with my credit card company.",
      order_id: "ORD-12345"
    }
  },
  {
    label: "⚖️ Legal Threat",
    data: {
      from_email: "robert.smith@corp.com",
      customer_name: "Robert Smith",
      subject: "Legal action notice",
      body: "I am writing to inform you that due to your continued failure to resolve my billing issue, I have retained legal counsel and will be pursuing litigation if this is not resolved within 48 hours. This is your final notice.",
      order_id: ""
    }
  },
  {
    label: "😊 Simple Query",
    data: {
      from_email: "alice@startup.io",
      customer_name: "Alice",
      subject: "How do I export my data?",
      body: "Hi! I just signed up and I'm loving the product. Quick question — how do I export my survey results to Excel? I need this for a presentation tomorrow. Thanks so much!",
      order_id: ""
    }
  },
  {
    label: "❓ Missing Info",
    data: {
      from_email: "confused@example.com",
      customer_name: "",
      subject: "It's broken",
      body: "Hi, my account isn't working and I can't login. Please help me fix this.",
      order_id: ""
    }
  }
];

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('compose');

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/process-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Processing failed');
      }

      const data = await res.json();
      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 20));
      setActiveTab('result');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Header />

      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-label">Quick Load</div>
          {SAMPLE_EMAILS.map((s, i) => (
            <button
              key={i}
              className="sample-btn"
              onClick={() => {
                setActiveTab('compose');
                window.__loadSample?.(s.data);
              }}
            >
              {s.label}
            </button>
          ))}

          <div className="sidebar-divider" />
          <div className="sidebar-label">Recent ({history.length})</div>
          {history.slice(0, 5).map((h, i) => (
            <button
              key={i}
              className="history-item"
              onClick={() => { setResult(h); setActiveTab('result'); }}
            >
              <span className={`dot dot-${h.analysis.urgency}`} />
              <span className="history-text">{h.analysis.intent.replace('_', ' ')}</span>
              {h.escalated && <span className="esc-badge">ESC</span>}
            </button>
          ))}
        </aside>

        <main className="content-area">
          <div className="tab-bar">
            <button
              className={`tab ${activeTab === 'compose' ? 'active' : ''}`}
              onClick={() => setActiveTab('compose')}
            >Compose</button>
            <button
              className={`tab ${activeTab === 'result' ? 'active' : ''} ${!result ? 'disabled' : ''}`}
              onClick={() => result && setActiveTab('result')}
            >Result {result && '✓'}</button>
          </div>

          {activeTab === 'compose' && (
            <EmailForm onSubmit={handleSubmit} loading={loading} error={error} />
          )}
          {activeTab === 'result' && result && (
            <ResultPanel result={result} />
          )}
        </main>
      </div>

      <style>{`
        .app-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
        }
        .main-layout {
          display: flex;
          flex: 1;
          gap: 0;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          padding: 24px 24px 48px;
          gap: 24px;
        }
        .sidebar {
          width: 200px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sidebar-label {
          font-family: var(--font-display);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-dimmer);
          padding: 8px 0 4px;
        }
        .sidebar-divider {
          height: 1px;
          background: var(--border);
          margin: 12px 0;
        }
        .sample-btn {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-dim);
          padding: 8px 12px;
          text-align: left;
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.15s;
        }
        .sample-btn:hover {
          border-color: var(--accent);
          color: var(--text);
          background: var(--bg3);
        }
        .history-item {
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          color: var(--text-dim);
          padding: 6px 10px;
          text-align: left;
          font-size: 12px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .history-item:hover {
          background: var(--bg2);
          border-color: var(--border);
          color: var(--text);
        }
        .history-text { flex: 1; text-transform: capitalize; }
        .dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
        }
        .dot-high { background: var(--danger); }
        .dot-medium { background: var(--warning); }
        .dot-low { background: var(--success); }
        .esc-badge {
          background: rgba(239,68,68,0.15);
          color: var(--danger);
          font-size: 9px;
          padding: 1px 5px;
          border-radius: 3px;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .content-area { flex: 1; min-width: 0; }
        .tab-bar {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
        }
        .tab {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-dim);
          padding: 8px 20px;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tab:hover:not(.disabled) {
          border-color: var(--accent);
          color: var(--text);
        }
        .tab.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }
        .tab.disabled { opacity: 0.3; cursor: default; }
        @media (max-width: 768px) {
          .main-layout { flex-direction: column; padding: 16px; }
          .sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; }
          .sidebar-label { width: 100%; }
        }
      `}</style>
    </div>
  );
}
