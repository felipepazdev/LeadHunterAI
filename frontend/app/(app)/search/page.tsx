'use client';

import { useState } from 'react';
import { Search, MapPin, Phone, Globe, Star, Bookmark, BookmarkCheck, Loader2, Instagram, MessageCircle } from 'lucide-react';
import { api } from '@/services/api';
import { SearchResult } from '@/types';

export default function SearchPage() {
  const [keyword,  setKeyword]  = useState('');
  const [city,     setCity]     = useState('');
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [saved,    setSaved]    = useState<Set<number>>(new Set());
  const [saving,   setSaving]   = useState<Set<number>>(new Set());
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [error,    setError]    = useState('');
  const [sortBy,   setSortBy]   = useState('default');

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const k = keyword.trim();
    const c = city.trim();
    if (!k || !c) return;

    setLoading(true);
    setError('');
    setSaved(new Set());
    setSearched(false);

    try {
      const data = await api.leads.search({ keyword: k, city: c });
      setResults(data);
      setSearched(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao realizar a busca. Tente novamente.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(idx: number, result: SearchResult) {
    if (saved.has(idx)) return;
    setSaving(prev => new Set(prev).add(idx));
    try {
      await api.leads.create({
        name:          result.name,
        phone:         result.phone,
        website:       result.website,
        googleMapsLink: result.googleMapsLink,
        rating:        result.rating,
        reviewsCount:  result.reviewsCount,
      });
      setSaved(prev => new Set(prev).add(idx));
      showToast(`"${result.name}" salvo nos seus leads!`);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Erro ao salvar lead', 'error');
    } finally {
      setSaving(prev => { const s = new Set(prev); s.delete(idx); return s; });
    }
  }

  function renderStars(rating: number) {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  }

  const getSortedResults = () => {
    const sorted = [...results];
    switch (sortBy) {
      case 'rating-desc':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'rating-asc':
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'reviews-desc':
        return sorted.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
      case 'reviews-asc':
        return sorted.sort((a, b) => (a.reviewsCount || 0) - (b.reviewsCount || 0));
      default:
        return sorted;
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Buscar Leads</h1>
        <p className="page-subtitle">Encontre empresas por segmento e cidade</p>
      </div>

      {/* Search Hero */}
      <div className="search-hero">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          🔍 Prospecção Inteligente
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Digite o segmento e a cidade para encontrar empresas qualificadas
        </p>

        <form onSubmit={handleSearch} className="search-bar">
          <div className="input-with-icon" style={{ flex: 2 }}>
            <Search size={16} className="input-icon" />
            <input
              className="form-input"
              placeholder="Ex: Clínica Odontológica, Academia, Restaurante..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </div>
          <div className="input-with-icon" style={{ flex: 1 }}>
            <MapPin size={16} className="input-icon" />
            <input
              className="form-input"
              placeholder="Cidade"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !keyword.trim() || !city.trim()}
            style={{ minWidth: 140, justifyContent: 'center' }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Search size={16} />}
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>

      {/* Erro */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 24, color: 'var(--danger)', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Resultados */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" /> Buscando empresas em {city}...
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p className="empty-title">Nenhum resultado encontrado</p>
          <p className="empty-desc">Tente outro segmento ou cidade diferente</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{results.length}</strong> empresas encontradas para
              {' '}<strong style={{ color: 'var(--accent)' }}>{keyword}</strong> em
              {' '}<strong style={{ color: 'var(--accent2)' }}>{city}</strong>
            </p>
            
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{saved.size} salvo(s)</span>
              <select 
                className="form-input" 
                style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default">Ordenação Padrão</option>
                <option value="rating-desc">Maior Avaliação</option>
                <option value="rating-asc">Menor Avaliação</option>
                <option value="reviews-desc">Mais Avaliações</option>
                <option value="reviews-asc">Menos Avaliações</option>
              </select>
            </div>
          </div>

          <div className="result-grid">
            {getSortedResults().map((result, idx) => {
              const originalIdx = results.findIndex(r => r.name === result.name && r.phone === result.phone);
              const isSaved  = saved.has(originalIdx !== -1 ? originalIdx : idx);
              const isSaving = saving.has(originalIdx !== -1 ? originalIdx : idx);
              return (
                <div key={idx} className="result-card" style={{ opacity: isSaved ? 0.75 : 1 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <p className="result-card-title" style={{ flex: 1, marginRight: 12, marginBottom: 0 }}>
                      {result.name}
                    </p>
                    <button
                      className={`btn btn-sm ${isSaved ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => handleSave(idx, result)}
                      disabled={isSaved || isSaving}
                      title={isSaved ? 'Já salvo' : 'Salvar lead'}
                    >
                      {isSaving
                        ? <span className="spinner" style={{ width: 12, height: 12 }} />
                        : isSaved
                          ? <><BookmarkCheck size={13} /> Salvo</>
                          : <><Bookmark size={13} /> Salvar</>}
                    </button>
                  </div>

                  {result.address && (
                    <div className="result-card-meta">
                      <MapPin size={12} /> {result.address}
                    </div>
                  )}
                  {result.phone && (
                    <div className="result-card-meta">
                      <Phone size={12} /> {result.phone}
                      <a href={`https://wa.me/55${result.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" 
                         style={{ marginLeft: 8, color: '#25D366' }} title="Chamar no WhatsApp">
                        <MessageCircle size={14} />
                      </a>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    {result.website ? (
                      <div className="result-card-meta" style={{ marginBottom: 0 }}>
                        <Globe size={12} />
                        <a href={result.website} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--accent2)', textDecoration: 'none' }}>
                          Website
                        </a>
                      </div>
                    ) : (
                      <div className="result-card-meta" style={{ marginBottom: 0, opacity: 0.5 }}>
                        <Globe size={12} /> <span>Sem Website</span>
                      </div>
                    )}

                    {result.instagram && (
                      <div className="result-card-meta" style={{ marginBottom: 0 }}>
                        <Instagram size={12} style={{ color: '#E4405F' }} />
                        <a href={result.instagram} target="_blank" rel="noreferrer"
                          style={{ color: '#E4405F', textDecoration: 'none' }}>
                          Instagram
                        </a>
                      </div>
                    )}
                  </div>

                  {result.rating !== undefined && (
                    <div className="result-rating">
                      <span className="stars">{renderStars(result.rating)}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                        {result.rating}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        ({result.reviewsCount?.toLocaleString('pt-BR')} avaliações)
                      </span>
                    </div>
                  )}

                  {result.googleMapsLink && (
                    <div style={{ marginTop: 12 }}>
                      <a href={result.googleMapsLink} target="_blank" rel="noreferrer"
                        className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>
                        <MapPin size={11} /> Ver no Google Maps
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!searched && !loading && (
        <div className="empty-state" style={{ padding: '48px 20px' }}>
          <div className="empty-icon" style={{ fontSize: 36 }}>🗺️</div>
          <p className="empty-title">Pronto para prospectar?</p>
          <p className="empty-desc">
            Preencha o segmento e a cidade acima para encontrar empresas qualificadas
          </p>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </>
  );
}
