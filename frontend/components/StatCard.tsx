'use client';

import { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  iconBg: string;
  value: number | string;
  label: string;
  change?: string;
  changeUp?: boolean;
}

export default function StatCard({ icon, iconBg, value, label, change, changeUp }: Props) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {change && (
        <div className="stat-change" style={{ color: changeUp ? 'var(--success)' : 'var(--danger)' }}>
          {changeUp ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
}
