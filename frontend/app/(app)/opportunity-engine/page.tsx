'use client';

import { useState } from 'react';
import {
  opportunityEngineApi,
  AnalyzeResponse,
  LeadRankEntry,
  AIPotential,
} from '@/services/opportunity-engine';
import {
  Zap,
  Search,
  TrendingUp,
  Globe,
  Megaphone,
  Star,
  Phone,
  ExternalLink,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Target,
  Sparkles,
} from 'lucide-react';

/* ── Utilitários de UI ─────────────────────────────────────────── */
function getPotentialColor(potential: AIPotential): string {
  switch (potential) {
    case 'ALTO_POTENCIAL':   return '#10b981';
    case 'MÉDIO_POTENCIAL':  return '#f59e0b';
    case 'BAIXO_POTENCIAL':  return '#6b7280';
  }
}

function getPotentialLabel(potential: AIPotential): string {
  switch (potential) {
    case 'ALTO_POTENCIAL':  return 'Alto Potencial';
    case 'MÉDIO_POTENCIAL': return 'Médio Potencial';
    case 'BAIXO_POTENCIAL': return 'Baixo Potencial';
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#6b7280';
}

function ScoreRing({ score }: { score: number }) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = (score / 100) * circ;
  const color = getScoreColor(score);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${pct} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 700, fontSize: 15, color,
      }}>{score}</span>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number | string; color: string
}) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function LeadCard({ entry, index }: { entry: LeadRankEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { company, adDetection, websiteAnalysis, opportunities, aiEvaluation, opportunityScore, prospectMessage } = entry;

  function copyMessage() {
    navigator.clipboard.writeText(prospectMessage.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 16, overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px var(--primary)20';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Header do card */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Ranking badge */}
        <div style={{
          minWidth: 32, height: 32, borderRadius: 8, background: 'var(--primary)18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary)', fontWeight: 700, fontSize: 13,
        }}>
          #{index + 1}
        </div>

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {company.name}
            </h3>
            {/* Badge potencial */}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: `${getPotentialColor(aiEvaluation.potential)}18`,
              color: getPotentialColor(aiEvaluation.potential),
              border: `1px solid ${getPotentialColor(aiEvaluation.potential)}30`,
            }}>
              {getPotentialLabel(aiEvaluation.potential)}
            </span>
            {/* Badge anúncio */}
            {adDetection.marketingActive && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: '#8b5cf618', color: '#8b5cf6',
                border: '1px solid #8b5cf630',
              }}>
                <Megaphone size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Anunciante
              </span>
            )}
          </div>

          {/* Dados rápidos */}
          <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
            {company.phone && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={11} /> {company.phone}
              </span>
            )}
            {company.rating && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={11} style={{ color: '#f59e0b' }} />
                {company.rating} ({company.reviewsCount} avaliações)
              </span>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                <Globe size={11} /> Website <ExternalLink size={10} />
              </a>
            )}
            {company.googleMapsLink && (
              <a href={company.googleMapsLink} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                <MapPin size={11} /> Maps
              </a>
            )}
          </div>
        </div>

        {/* Score */}
        <ScoreRing score={opportunityScore.total} />
      </div>

      {/* Mensagem de prospecção */}
      <div style={{
        margin: '0 20px', padding: '12px 14px',
        background: 'rgba(139,92,246,0.07)', borderRadius: 10,
        border: '1px solid rgba(139,92,246,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Sparkles size={14} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
            {prospectMessage.text}
          </p>
          <button onClick={copyMessage} title="Copiar mensagem" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? '#10b981' : 'var(--text-muted)', padding: '0 2px',
            flexShrink: 0, transition: 'color 0.2s',
          }}>
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Toggle expandir */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--text-muted)', fontSize: 12, transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <span>Ver análise completa</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Detalhe expandido */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Análise do site */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Análise Digital
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {[
                { icon: <Globe size={12} />, label: 'Website', ok: websiteAnalysis.hasWebsite },
                { icon: <TrendingUp size={12} />, label: 'Versão Mobile', ok: websiteAnalysis.hasMobileVersion },
                { icon: <Target size={12} />, label: 'Formulário', ok: websiteAnalysis.hasContactForm },
                { icon: <BarChart3 size={12} />, label: 'Landing Page', ok: websiteAnalysis.hasLandingPage },
              ].map(({ icon, label, ok }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                  color: ok ? '#10b981' : 'var(--text-muted)',
                }}>
                  <span style={{ color: ok ? '#10b981' : '#ef4444' }}>
                    {ok !== undefined
                      ? (ok ? <CheckCircle size={13} /> : <XCircle size={13} />)
                      : <XCircle size={13} />
                    }
                  </span>
                  {icon} {label}
                </div>
              ))}
            </div>
            {websiteAnalysis.hasWebsite && websiteAnalysis.loadTimeMs && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Tempo de carga:</span>
                <span style={{
                  fontWeight: 600,
                  color: websiteAnalysis.loadTimeMs < 2000 ? '#10b981'
                    : websiteAnalysis.loadTimeMs < 4000 ? '#f59e0b' : '#ef4444',
                }}>
                  {(websiteAnalysis.loadTimeMs / 1000).toFixed(1)}s
                </span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span style={{ color: 'var(--text-muted)' }}>Score digital: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{websiteAnalysis.digitalScore}/10</span>
              </div>
            )}
          </div>

          {/* Oportunidades */}
          {opportunities.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Oportunidades Detectadas ({opportunities.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {opportunities.map(opp => (
                  <div key={opp.type} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                  }}>
                    <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{opp.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{opp.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avaliação IA */}
          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: `${getPotentialColor(aiEvaluation.potential)}0d`,
            border: `1px solid ${getPotentialColor(aiEvaluation.potential)}25`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Avaliação IA
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: getPotentialColor(aiEvaluation.potential),
              }}>
                ● {getPotentialLabel(aiEvaluation.potential)}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {aiEvaluation.reasoning}
            </p>
          </div>

          {/* Score breakdown */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Score Detalhado
            </div>
            {[
              { label: 'Presença em Anúncios', value: opportunityScore.breakdown.adsScore, max: 40 },
              { label: 'Qualidade do Site', value: opportunityScore.breakdown.siteScore, max: 30 },
              { label: 'Avaliação / Reputação', value: opportunityScore.breakdown.ratingScore, max: 30 },
            ].map(({ label, value, max }) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}/{max}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    background: getScoreColor(opportunityScore.total),
                    width: `${(value / max) * 100}%`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Página principal ──────────────────────────────────────────── */
export default function OpportunityEnginePage() {
  const [keyword, setKeyword]   = useState('');
  const [city, setCity]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [result, setResult]     = useState<AnalyzeResponse | null>(null);
  const [filterPotential, setFilterPotential] = useState<string>('ALL');

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() || !city.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await opportunityEngineApi.analyze({ keyword: keyword.trim(), city: city.trim() });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  const filteredRanking = result?.ranking.filter(e =>
    filterPotential === 'ALL' || e.aiEvaluation.potential === filterPotential
  ) ?? [];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              Lead Opportunity Engine
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Análise inteligente de oportunidades de venda por IA
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de busca */}
      <form onSubmit={handleAnalyze} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 24, marginBottom: 28,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Segmento / Palavra-chave
            </label>
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Ex: clínica estética, advocacia..."
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-base)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)',
                fontSize: 14, outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Cidade
            </label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ex: São Paulo, Rio de Janeiro..."
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-base)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)',
                fontSize: 14, outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !keyword.trim() || !city.trim()}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
          }}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: 16, height: 16 }} />
              Analisando com IA...
            </>
          ) : (
            <>
              <Search size={16} />
              Analisar Oportunidades
            </>
          )}
        </button>
      </form>

      {/* Erro */}
      {error && (
        <div style={{
          padding: '14px 16px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          color: '#ef4444', fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Resultados */}
      {result && (
        <>
          {/* Cards de resumo */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12, marginBottom: 24,
          }}>
            <SummaryCard icon={<Target size={18} />}      label="Empresas analisadas"    value={result.summary.total}          color="#6366f1" />
            <SummaryCard icon={<TrendingUp size={18} />}  label="Alto potencial"         value={result.summary.highPotential}  color="#10b981" />
            <SummaryCard icon={<Megaphone size={18} />}   label="Anunciantes"           value={result.summary.withAds}         color="#8b5cf6" />
            <SummaryCard icon={<Globe size={18} />}       label="Sem website"           value={result.summary.withoutWebsite}  color="#f59e0b" />
            <SummaryCard icon={<BarChart3 size={18} />}   label="Score médio"           value={`${result.summary.avgScore}/100`} color="#06b6d4" />
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { value: 'ALL', label: 'Todos' },
              { value: 'ALTO_POTENCIAL', label: '🟢 Alto' },
              { value: 'MÉDIO_POTENCIAL', label: '🟡 Médio' },
              { value: 'BAIXO_POTENCIAL', label: '⚫ Baixo' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterPotential(value)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: '1px solid',
                  borderColor: filterPotential === value ? 'transparent' : 'var(--border)',
                  background: filterPotential === value ? 'var(--primary)' : 'var(--bg-card)',
                  color: filterPotential === value ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
              {filteredRanking.length} empresa(s)
            </span>
          </div>

          {/* Ranking de leads */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredRanking.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>
                Nenhuma empresa com esse filtro.
              </div>
            ) : (
              filteredRanking.map((entry, i) => (
                <LeadCard key={`${entry.company.name}-${i}`} entry={entry} index={i} />
              ))
            )}
          </div>
        </>
      )}

      {/* Estado inicial */}
      {!result && !loading && !error && (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          color: 'var(--text-muted)', fontSize: 14,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #7c3aed18, #4f46e518)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={28} style={{ color: '#7c3aed' }} />
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Pronto para analisar
          </p>
          <p style={{ margin: 0 }}>
            Informe o segmento e a cidade para o motor de IA identificar oportunidades.
          </p>
        </div>
      )}
    </div>
  );
}
