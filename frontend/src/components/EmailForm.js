import React, { useState, useEffect } from 'react';

const INITIAL = {
  from_email: '',
  customer_name: '',
  subject: '',
  body: '',
  order_id: ''
};

export default function EmailForm({ onSubmit, loading, error }) {
  const [form, setForm] = useState(INITIAL);

  // Allow App.js to load sample emails
  useEffect(() => {
    window.__loadSample = (data) => setForm({ ...INITIAL, ...data });
    return () => { delete window.__loadSample; };
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const valid = form.from_email && form.subject && form.body;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (valid && !loading) onSubmit(form);
  };

  return (
    <div className="form-shell">
      <div className="form-header">
        <h1 className="form-title">Incoming Customer Email</h1>
        <p className="form-sub">The AI agent will analyze, decide, and act autonomously.</p>
      </div>

      <form onSubmit={handleSubmit} className="email-form">
        <div className="field-row">
          <div className="field">
            <label>From Email *</label>
            <input
              type="email"
              placeholder="customer@example.com"
              value={form.from_email}
              onChange={set('from_email')}
              required
            />
          </div>
          <div className="field">
            <label>Customer Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.customer_name}
              onChange={set('customer_name')}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Subject *</label>
            <input
              type="text"
              placeholder="Email subject line"
              value={form.subject}
              onChange={set('subject')}
              required
            />
          </div>
          <div className="field field-sm">
            <label>Order ID</label>
            <input
              type="text"
              placeholder="ORD-12345"
              value={form.order_id}
              onChange={set('order_id')}
            />
          </div>
        </div>

        <div className="field">
          <label>Email Body *</label>
          <textarea
            rows={8}
            placeholder="Paste or type the full customer email here..."
            value={form.body}
            onChange={set('body')}
            required
          />
        </div>

        {error && (
          <div className="error-box">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={() => setForm(INITIAL)}>
            Clear
          </button>
          <button type="submit" className={`btn-primary ${!valid || loading ? 'disabled' : ''}`} disabled={!valid || loading}>
            {loading ? (
              <span className="loading-inner">
                <span className="spinner" />
                Analyzing...
              </span>
            ) : (
              '→ Process Email'
            )}
          </button>
        </div>
      </form>

      <style>{`
        .form-shell {
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-header { margin-bottom: 28px; }
        .form-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .form-sub { color: var(--text-dim); font-size: 14px; }

        .email-form { display: flex; flex-direction: column; gap: 16px; }

        .field-row { display: flex; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .field-sm { max-width: 180px; }

        label {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-dim);
          font-family: var(--font-display);
        }

        input, textarea {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-family: var(--font-body);
          font-size: 14px;
          padding: 10px 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          resize: vertical;
        }
        input::placeholder, textarea::placeholder { color: var(--text-dimmer); }
        input:focus, textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .error-box {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          color: #fca5a5;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .error-icon { font-size: 16px; }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 4px;
        }
        .btn-ghost {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-dim);
          padding: 10px 20px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-ghost:hover { border-color: var(--text-dim); color: var(--text); }

        .btn-primary {
          background: var(--accent);
          border: none;
          border-radius: var(--radius-sm);
          color: white;
          padding: 10px 28px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 0 20px var(--accent-glow);
          min-width: 160px;
        }
        .btn-primary:hover:not(.disabled) {
          background: #7c7ff5;
          box-shadow: 0 0 30px rgba(99,102,241,0.4);
          transform: translateY(-1px);
        }
        .btn-primary.disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .loading-inner { display: flex; align-items: center; gap: 8px; justify-content: center; }
        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .field-row { flex-direction: column; }
          .field-sm { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
