'use client';
import { LeadStatus } from '../types';

const CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  FOUND:     { label: 'Encontrado',  className: 'badge-found'     },
  CONTACTED: { label: 'Contatado',   className: 'badge-contacted' },
  REPLIED:   { label: 'Respondeu',   className: 'badge-replied'   },
  MEETING:   { label: 'Reunião',     className: 'badge-meeting'   },
  CLIENT:    { label: 'Cliente',     className: 'badge-client'    },
};

export default function LeadBadge({ status }: { status: LeadStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.FOUND;
  return <span className={`badge ${className}`}>{label}</span>;
}
