import React from 'react';
import './KpiTiles.css';

// Lightweight inline SVG icon set (stroke inherits currentColor)
export const KPI_ICONS = {
  banknote: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.25" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  checkCircle: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  alert: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  ),
  calendar: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  users: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  chartUp: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 6-6" />
    </svg>
  ),
  wallet: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 0 0-2 2v7a3 3 0 0 0 3 3h15a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
      <path d="M18 11h2" />
      <path d="M12 7V5a2 2 0 0 0-2-2H5" />
    </svg>
  ),
  receipt: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8V21l-3-2-3 2-3-2-3 2-3-2-3 2V3h14" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  ),
  tag: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 12 22l-8-8 8.59-8.59A2 2 0 0 1 14 5h6v6a2 2 0 0 1-.59 1.41Z" />
      <circle cx="7.5" cy="12.5" r="1.5" />
    </svg>
  ),
};

const KpiTiles = ({ items = [] }) => {
  return (
    <div className="kpi-tiles">
      {items.map((it, idx) => {
        const Icon = it.icon || KPI_ICONS.banknote;
        const accent = it.color || 'indigo';
        return (
          <div key={idx} className={`kpi-tile accent-${accent}`}>
            <div className="kpi-tile-head">
              <div className="kpi-icon" aria-hidden><Icon /></div>
              <div className="kpi-metric">
                <span className="kpi-number">{it.value}</span>
                <span className="kpi-label">{it.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiTiles;