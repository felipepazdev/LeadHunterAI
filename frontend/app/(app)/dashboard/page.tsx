'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Target, Search, TrendingUp, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { api } from '@/services/api';
import { getSession } from '@/services/auth';
import StatCard from '@/components/StatCard';
import LeadBadge from '@/components/LeadBadge';
import { Lead, SearchHistory } from '@/types';

/* ─── agrupamento por data ─── */
function groupByDay(history: SearchHistory[]) {
  const map = new Map<string, number>();
  history.forEach(h => {
    const day = new Date(h.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    map.set(day, (map.get(day) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .slice(-14)
    .map(([date, buscas]) => ({ date, buscas }));
}

export default function DashboardPage() {
  const [leads,   setLeads]   = useState<Lead[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    const { user } = getSession();
    if (!user) return;
    try {
      const [leadsRes, histRes] = await Promise.all([
        api.users.getWithLeads(user.id),
        api.users.getWithHistory(user.id),
      ]);
      setLeads(leadsRes.user.leads);
      setHistory(histRes.user.searchHistory);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clientLeads  = leads.filter(l => l.status === 'CLIENT').length;
  const meetingLeads = leads.filter(l => l.status === 'MEETING').length;
  const chartData    = groupByDay(history);
  const recentLeads  = leads.slice(0, 5);

  if (loading) return (
    <div className="loading-overlay">
      <div className="spinner" />
      Carregando dashboard...
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral da sua prospecção de leads</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 24, color: 'var(--danger)', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="stats-grid">
        <StatCard
          icon={<Target size={20} color="var(--accent)" />}
          iconBg="var(--accent-dim)"
          value={leads.length}
          label="Total de Leads"
        />
        <StatCard
          icon={<Search size={20} color="var(--accent2)" />}
          iconBg="var(--accent2-dim)"
          value={history.length}
          label="Buscas Realizadas"
        />
        <StatCard
          icon={<TrendingUp size={20} color="var(--success)" />}
          iconBg="rgba(52,211,153,.12)"
          value={meetingLeads}
          label="Em Reunião"
        />
        <StatCard
          icon={<Users size={20} color="var(--warning)" />}
          iconBg="rgba(251,191,36,.12)"
          value={clientLeads}
          label="Convertidos em Clientes"
        />
      </div>

      {/* ── Charts + Recent Leads ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 24 }}>
        {/* Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Histórico de Buscas (últimos 14 dias)</span>
          </div>
          <div className="card-body">
            {chartData.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma busca realizada ainda</p>
              </div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="gradBuscas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6c6ef5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6c6ef5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,112,210,0.1)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                      itemStyle={{ color: 'var(--accent)' }}
                      formatter={(v: unknown) => [Number(v), 'Buscas']}
                    />
                    <Area type="monotone" dataKey="buscas" stroke="#6c6ef5" strokeWidth={2} fill="url(#gradBuscas)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Funil rápido */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pipeline de Leads</span>
          </div>
          <div className="card-body">
            {(['FOUND','CONTACTED','REPLIED','MEETING','CLIENT'] as const).map(status => {
              const count = leads.filter(l => l.status === status).length;
              const pct   = leads.length ? Math.round(count / leads.length * 100) : 0;
              return (
                <div key={status} style={{ marginBottom: 16 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <LeadBadge status={status} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent2))', borderRadius: 99, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Leads ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Leads Recentes</span>
          <Link href="/leads" className="btn btn-secondary btn-sm">
            Ver todos <ArrowRight size={13} />
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p className="empty-title">Nenhum lead salvo</p>
            <p className="empty-desc">Faça uma busca para começar a coletar leads</p>
            <Link href="/search" className="btn btn-primary" style={{ marginTop: 8 }}>
              <Search size={15} /> Buscar agora
            </Link>
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
                </tr>
              </thead>
              <tbody>
                {recentLeads.map(lead => (
                  <tr key={lead.id}>
                    <td className="td-name">{lead.name}</td>
                    <td>{lead.phone ?? '—'}</td>
                    <td>
                      {lead.website
                        ? <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent2)', fontSize: 13 }}>Abrir ↗</a>
                        : '—'}
                    </td>
                    <td>
                      {lead.rating
                        ? <span>⭐ {lead.rating} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({lead.reviewsCount})</span></span>
                        : '—'}
                    </td>
                    <td><LeadBadge status={lead.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
