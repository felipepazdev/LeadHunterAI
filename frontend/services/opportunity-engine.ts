/**
 * Serviço de API do módulo Opportunity Engine (frontend).
 * Segue exatamente o padrão do services/api.ts existente.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('leadhunter_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('leadhunter_token');
      localStorage.removeItem('leadhunter_user');
      window.location.href = '/login';
    }
    throw new Error('Sessão expirada');
  }

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || 'Erro desconhecido';
    throw new Error(msg);
  }

  return data as T;
}

/* ── Tipos ─────────────────────────────────────────────────────── */
export type AIPotential = 'ALTO_POTENCIAL' | 'MÉDIO_POTENCIAL' | 'BAIXO_POTENCIAL';
export type OpportunityType =
  | 'SLOW_SITE_WITH_ADS' | 'HIGH_RATING_WEAK_SITE' | 'NO_CONTACT_FORM'
  | 'NO_LANDING_PAGE' | 'NO_WEBSITE' | 'NO_DIGITAL_PRESENCE';

export interface RawCompany {
  name: string;
  phone?: string | null;
  website?: string | null;
  googleMapsLink?: string | null;
  address?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  isSponsored?: boolean;
  instagram?: string | null;
}

export interface AdDetectionResult {
  marketingActive: boolean;
  adPosition?: number;
}

export interface WebsiteAnalysis {
  hasWebsite: boolean;
  loadTimeMs?: number;
  hasMobileVersion?: boolean;
  hasContactForm?: boolean;
  hasLandingPage?: boolean;
  digitalScore: number;
}

export interface DetectedOpportunity {
  type: OpportunityType;
  label: string;
  description: string;
}

export interface AIEvaluation {
  potential: AIPotential;
  reasoning: string;
}

export interface OpportunityScore {
  total: number;
  breakdown: { adsScore: number; siteScore: number; ratingScore: number };
}

export interface ProspectMessage {
  text: string;
}

export interface LeadRankEntry {
  company: RawCompany;
  adDetection: AdDetectionResult;
  websiteAnalysis: WebsiteAnalysis;
  opportunities: DetectedOpportunity[];
  aiEvaluation: AIEvaluation;
  opportunityScore: OpportunityScore;
  prospectMessage: ProspectMessage;
}

export interface AnalyzeSummary {
  total: number;
  highPotential: number;
  mediumPotential: number;
  lowPotential: number;
  withAds: number;
  withoutWebsite: number;
  avgScore: number;
}

export interface AnalyzeResponse {
  summary: AnalyzeSummary;
  ranking: LeadRankEntry[];
}

/* ── API ────────────────────────────────────────────────────────── */
export const opportunityEngineApi = {
  analyze: (body: { keyword: string; city: string; companies?: RawCompany[] }) =>
    request<AnalyzeResponse>('/opportunity-engine/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  analyzeSingle: (body: { company: RawCompany; keyword?: string; city?: string }) =>
    request<LeadRankEntry>('/opportunity-engine/analyze/single', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
