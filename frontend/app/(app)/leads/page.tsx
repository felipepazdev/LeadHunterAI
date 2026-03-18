'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trash2, ExternalLink, Filter } from 'lucide-react';
import { api } from '@/services/api';
import { getSession } from '@/services/auth';
import LeadBadge from '@/components/LeadBadge';
import { Lead, LeadStatus } from '@/types';

const STATUS_OPTIONS: { value: LeadStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',       label: 'Todos'        },
  { value: 'FOUND',     label: 'Encontrado'   },
  { value: 'CONTACTED', label: 'Contatado'    },
  { value: 'REPLIED',   label: 'Respondeu'    },
  { value: 'MEETING',   label: 'Reunião'      },
  { value: 'CLIENT',    label: 'Cliente'      },
];

export default function LeadsPage() {
  const [leads,      setLeads]      = useState<Lead[]>([]);
  const [filter,     setFilter]     = useState<LeadStatus | 'ALL'>('ALL');
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(async () => {
    const { user } = getSession();
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.users.getWithLeads(user.id);
      setLeads(res.user.leads);
    } catch {
      showToast('Erro ao carregar leads', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id: string, status: LeadStatus) {
    setUpdatingId(id);
    try {
      await api.leads.updateStatus(id, status);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      showToast('Status atualizado!');
    } catch {
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este lead?')) return;
    setDeleting(id);
    try {
      await api.leads.delete(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      showToast('Lead removido!');
    } catch {
      showToast('Erro ao remover lead', 'error');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = leads.filter(l => {
    const matchStatus = filter === 'ALL' || l.status === filter;
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Meus Leads</h1>
        <p className="page-subtitle">{leads.length} leads salvos · {filtered.length} exibidos</p>
      </div>

      {/* Barra de filtros */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="input-with-icon" style={{ flex: '1', minWidth: 200 }}>
              <Filter size={15} className="input-icon" />
              <input
                className="form-input"
                placeholder="Filtrar por nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              value={filter}
              onChange={e => setFilter(e.target.value as LeadStatus | 'ALL')}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        {loading ? (
          <div className="loading-overlay">
            <div className="spinner" /> Carregando leads...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p className="empty-title">Nenhum lead encontrado</p>
            <p className="empty-desc">Ajuste os filtros ou realize uma nova busca</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Telefone</th>
                  <th>Website</th>
                  <th>Avaliação</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}>
                    <td className="td-name">{lead.name}</td>
                    <td style={{ fontSize: 13 }}>{lead.phone ?? '—'}</td>
                    <td>
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer"
                          className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                          <ExternalLink size={12} /> Abrir
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      {lead.rating
                        ? <span style={{ fontSize: 13 }}>⭐ {lead.rating} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({lead.reviewsCount})</span></span>
                        : '—'}
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        disabled={updatingId === lead.id}
                        style={{ fontSize: 12, padding: '5px 10px' }}
                      >
                        {STATUS_OPTIONS.filter(o => o.value !== 'ALL').map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-icon"
                        onClick={() => handleDelete(lead.id)}
                        disabled={deleting === lead.id}
                        title="Remover lead"
                      >
                        {deleting === lead.id
                          ? <span className="spinner" style={{ width: 14, height: 14 }} />
                          : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </>
  );
}
