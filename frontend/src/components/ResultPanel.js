import React, { useState } from 'react';

const INTENT_LABELS = {
  refund_request: '💳 Refund Request',
  complaint: '😤 Complaint',
  query: '❓ Query',
  cancellation: '🚫 Cancellation',
  appreciation: '💚 Appreciation',
  callback_request: '📞 Callback Request',
  escalation: '🚨 Escalation',
  other: '📧 Other'
};

const TONE_COLORS = {
  angry: '#ef4444',
  frustrated: '#f97316',
  sad: '#8b5cf6',
  neutral: '#6b7280',
  satisfied: '#10b981',
  anxious: '#f59e0b'
};

const ACTION_ICONS = {
  process_refund: '💳',
  send_apology: '🤝',
  schedule_callback: '📞',
  escalate_to_human: '🚨',
  ask_followup: '❓',
  apply_goodwill_credit: '🎁'
};

const ACTION_LABELS = {
  process_refund: 'Refund Processed',
  send_apology: 'Apology Sent',
  schedule_callback: 'Callback Scheduled',
  escalate_to_human: 'Escalated to Human',
  ask_followup: 'Follow-up Generated',
  apply_goodwill_credit: 'Goodwill Credit Applied'
};

function SentimentBar({ score }) {
  const pct = ((score + 1) / 2) * 100;
  const color = score < -0.3 ? '#ef4444' : score < 0.3 ? '#f59e0b' : '#10b981';
  return (
    <div className="sentiment-bar-wrap">
      <div className="sentiment-bar-track">
        <div className="sentiment-bar-fill" style={{ width: `${pct}%`, background: color }} />
        <div className="sentiment-bar-thumb" style={{ left: `${pct}%`, background: color }} />
      </div>
      <div className="sentiment-labels">
        <span>Negative</span>
        <span style={{ color }}>{score.toFixed(2)}</span>
        <span>Positive</span>
      </div>
      <style>{`
        .sentiment-bar-wrap { margin-top: 4px; }
        .sentiment-bar-track {
          height: 6px;
          background: var(--bg);
          border-radius: 3px;
          position: relative;
          overflow: visible;
        }
        .sentiment-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.8s ease;
        }
        .sentiment-bar-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 12px; height: 12px;
          border-radius: 50%;
          border: 2px solid var(--bg2);
          transition: left 0.8s ease;
        }
        .sentiment-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-dimmer);
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
}

export default function ResultPanel({ result }) {
  const { analysis, actions_taken, response_email, follow_up_questions, escalated, processing_time_ms, email_id } = result;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(response_email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="result-shell">
      <div className="result-header">
        <div>
          <h1 className="result-title">
            {escalated ? '🚨 Escalated' : '✅ Resolved'}
          </h1>
          <p className="result-meta">
            {email_id} · {processing_time_ms}ms · {actions_taken.length} action{actions_taken.length !== 1 ? 's' : ''} taken
          </p>
        </div>
        {escalated && (
          <div className="escalation-badge">
            ESCALATED TO HUMAN
          </div>
        )}
      </div>

      <div className="result-grid">

        {/* Analysis Card */}
        <div className="card">
          <div className="card-title">📊 Email Analysis</div>
          <div className="analysis-grid">
            <div className="analysis-item">
              <span className="ai-label">Intent</span>
              <span className="ai-value">{INTENT_LABELS[analysis.intent] || analysis.intent}</span>
            </div>
            <div className="analysis-item">
              <span className="ai-label">Urgency</span>
              <span className={`urgency-chip urgency-${analysis.urgency}`}>
                {analysis.urgency.toUpperCase()}
              </span>
            </div>
            <div className="analysis-item">
              <span className="ai-label">Tone</span>
              <span className="tone-chip" style={{ color: TONE_COLORS[analysis.emotional_tone], borderColor: TONE_COLORS[analysis.emotional_tone] + '40', background: TONE_COLORS[analysis.emotional_tone] + '15' }}>
                {analysis.emotional_tone}
              </span>
            </div>
          </div>

          <div className="analysis-section">
            <span className="ai-label">Summary</span>
            <p className="summary-text">{analysis.summary}</p>
          </div>

          <div className="analysis-section">
            <span className="ai-label">Sentiment Score</span>
            <SentimentBar score={analysis.sentiment_score} />
          </div>

          {analysis.key_issues.length > 0 && (
            <div className="analysis-section">
              <span className="ai-label">Key Issues</span>
              <div className="tag-list">
                {analysis.key_issues.map((issue, i) => (
                  <span key={i} className="tag">{issue}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.escalation_reason && (
            <div className="escalation-reason">
              <span className="esc-icon">⚠</span>
              {analysis.escalation_reason}
            </div>
          )}
        </div>

        {/* Actions Card */}
        <div className="card">
          <div className="card-title">⚡ Actions Taken</div>
          {actions_taken.length === 0 ? (
            <p className="no-actions">No autonomous actions triggered.</p>
          ) : (
            <div className="actions-list">
              {actions_taken.map((action, i) => (
                <div key={i} className={`action-item ${action.action_type === 'apply_goodwill_credit' ? 'action-custom' : ''}`}>
                  <div className="action-header">
                    <span className="action-icon">{ACTION_ICONS[action.action_type] || '🔧'}</span>
                    <span className="action-label">{ACTION_LABELS[action.action_type] || action.action_type}</span>
                    {action.action_type === 'apply_goodwill_credit' && (
                      <span className="custom-rule-badge">CUSTOM RULE</span>
                    )}
                    <span className={`action-status ${action.success ? 'ok' : 'fail'}`}>
                      {action.success ? '✓' : '✗'}
                    </span>
                  </div>
                  <p className="action-msg">{action.message}</p>
                  {action.details.refund_id && (
                    <code className="action-code">ID: {action.details.refund_id}</code>
                  )}
                  {action.details.ticket_id && (
                    <code className="action-code">Ticket: {action.details.ticket_id}</code>
                  )}
                  {action.details.credit_id && (
                    <code className="action-code">Credit: {action.details.credit_id} · ${action.details.credit_amount}</code>
                  )}
                  {action.details.scheduled_for && (
                    <code className="action-code">Scheduled: {action.details.scheduled_for}</code>
                  )}
                </div>
              ))}
            </div>
          )}

          {follow_up_questions.length > 0 && (
            <div className="followup-section">
              <div className="card-title" style={{ fontSize: '13px', marginBottom: '10px' }}>❓ Follow-up Needed</div>
              <ul className="followup-list">
                {follow_up_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Response Email Card */}
        <div className="card card-full">
          <div className="card-title-row">
            <div className="card-title">✉️ Generated Response</div>
            <button className="copy-btn" onClick={copy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="response-email">
            {response_email.split('\n').map((line, i) => (
              <p key={i} style={{ marginBottom: line === '' ? '12px' : '0' }}>{line}</p>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .result-shell {
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .result-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .result-meta { font-size: 13px; color: var(--text-dimmer); }
        .escalation-badge {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.4);
          color: #fca5a5;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          font-family: var(--font-display);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }

        .result-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
        }
        .card-full { grid-column: 1 / -1; }
        .card-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--text);
          margin-bottom: 16px;
          letter-spacing: 0.02em;
        }
        .card-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .analysis-grid {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .analysis-item { display: flex; flex-direction: column; gap: 4px; }
        .ai-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-dimmer);
          font-family: var(--font-display);
        }
        .ai-value { font-size: 14px; color: var(--text); font-weight: 500; }
        .urgency-chip {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 4px;
          font-family: var(--font-display);
          letter-spacing: 0.08em;
        }
        .urgency-high { background: rgba(239,68,68,0.15); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
        .urgency-medium { background: rgba(245,158,11,0.15); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
        .urgency-low { background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
        .tone-chip {
          font-size: 12px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 4px;
          border: 1px solid;
          text-transform: capitalize;
        }

        .analysis-section { margin-bottom: 14px; }
        .summary-text { font-size: 14px; color: var(--text-dim); margin-top: 4px; line-height: 1.5; }
        .tag-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .tag {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 3px 10px;
          font-size: 12px;
          color: var(--text-dim);
        }
        .escalation-reason {
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 13px;
          color: #fca5a5;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .actions-list { display: flex; flex-direction: column; gap: 10px; }
        .action-item {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
        }
        .action-custom {
          border-color: rgba(34,211,238,0.3);
          background: rgba(34,211,238,0.04);
        }
        .action-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .action-icon { font-size: 16px; }
        .action-label {
          font-weight: 600;
          font-size: 13px;
          color: var(--text);
          flex: 1;
        }
        .custom-rule-badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 2px 6px;
          border-radius: 3px;
          background: rgba(34,211,238,0.15);
          color: var(--accent2);
          border: 1px solid rgba(34,211,238,0.3);
          font-family: var(--font-display);
        }
        .action-status { font-weight: 700; font-size: 14px; }
        .action-status.ok { color: var(--success); }
        .action-status.fail { color: var(--danger); }
        .action-msg { font-size: 12px; color: var(--text-dim); margin-bottom: 4px; }
        .action-code {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: var(--text-dimmer);
          display: block;
          margin-top: 4px;
        }
        .no-actions { color: var(--text-dimmer); font-size: 14px; }

        .followup-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .followup-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .followup-list li {
          font-size: 13px;
          color: var(--text-dim);
          padding-left: 16px;
          position: relative;
        }
        .followup-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--accent);
        }

        .response-email {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 20px;
          font-size: 14px;
          color: var(--text-dim);
          line-height: 1.7;
          white-space: pre-wrap;
        }
        .copy-btn {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-dim);
          padding: 6px 14px;
          font-size: 12px;
          font-family: var(--font-display);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .copy-btn:hover {
          border-color: var(--accent);
          color: var(--text);
        }

        @media (max-width: 768px) {
          .result-grid { grid-template-columns: 1fr; }
          .card-full { grid-column: 1; }
        }
      `}</style>
    </div>
  );
}
