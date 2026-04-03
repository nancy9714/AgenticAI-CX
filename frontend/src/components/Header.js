import React from 'react';

export default function Header() {
  return (
    <header>
      <div className="header-inner">
        <div className="logo">
          <span className="logo-mark">Z</span>
          <div className="logo-text">
            <span className="logo-brand">Zykrr</span>
            <span className="logo-sub">CX Engine</span>
          </div>
        </div>
        <div className="header-badges">
          <span className="badge badge-ai">Powered by Claude</span>
          <span className="badge badge-live">● Live</span>
        </div>
      </div>
      <style>{`
        header {
          border-bottom: 1px solid var(--border);
          background: rgba(10,10,15,0.8);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo { display: flex; align-items: center; gap: 12px; }
        .logo-mark {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 18px;
          color: white;
          box-shadow: 0 0 20px var(--accent-glow);
        }
        .logo-text { display: flex; flex-direction: column; line-height: 1.1; }
        .logo-brand {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 16px;
          color: var(--text);
        }
        .logo-sub {
          font-size: 11px;
          color: var(--text-dimmer);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .header-badges { display: flex; gap: 8px; align-items: center; }
        .badge {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          font-family: var(--font-body);
          font-weight: 500;
        }
        .badge-ai {
          background: var(--accent-glow);
          border: 1px solid var(--border-active);
          color: #a5b4fc;
        }
        .badge-live {
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.3);
          color: var(--success);
        }
      `}</style>
    </header>
  );
}
