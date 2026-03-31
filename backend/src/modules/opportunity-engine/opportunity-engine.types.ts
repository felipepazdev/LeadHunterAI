/**
 * opportunity-engine.types.ts
 * Tipos compartilhados do módulo Lead Opportunity Engine.
 */

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

/* ── Ad Detection ─────────────────────────────────────────────── */
export interface AdDetectionResult {
  marketingActive: boolean;
  /** posição estimada no resultado (sponsored = primeiros slots) */
  adPosition?: number;
}

/* ── Website Analysis ─────────────────────────────────────────── */
export interface WebsiteAnalysis {
  hasWebsite: boolean;
  loadTimeMs?: number;          // tempo de carregamento simulado
  hasMobileVersion?: boolean;
  hasContactForm?: boolean;
  hasLandingPage?: boolean;
  digitalScore: number;         // 1-10
}

/* ── Opportunity Rules ────────────────────────────────────────── */
export type OpportunityType =
  | 'SLOW_SITE_WITH_ADS'
  | 'HIGH_RATING_WEAK_SITE'
  | 'NO_CONTACT_FORM'
  | 'NO_LANDING_PAGE'
  | 'NO_WEBSITE'
  | 'NO_DIGITAL_PRESENCE';

export interface DetectedOpportunity {
  type: OpportunityType;
  label: string;               // texto humano da oportunidade
  description: string;         // detalhe para o prospecto
}

/* ── AI Evaluation ───────────────────────────────────────────── */
export type AIPotential = 'ALTO_POTENCIAL' | 'MÉDIO_POTENCIAL' | 'BAIXO_POTENCIAL';

export interface AIEvaluation {
  potential: AIPotential;
  reasoning: string;
}

/* ── Opportunity Score ───────────────────────────────────────── */
export interface OpportunityScore {
  total: number;          // 0-100
  breakdown: {
    adsScore: number;     // 0-40
    siteScore: number;    // 0-30
    ratingScore: number;  // 0-30
  };
}

/* ── Personalized Message ────────────────────────────────────── */
export interface ProspectMessage {
  text: string;
}

/* ── Lead Rank Entry (resultado final) ───────────────────────── */
export interface LeadRankEntry {
  company: RawCompany;
  adDetection: AdDetectionResult;
  websiteAnalysis: WebsiteAnalysis;
  opportunities: DetectedOpportunity[];
  aiEvaluation: AIEvaluation;
  opportunityScore: OpportunityScore;
  prospectMessage: ProspectMessage;
}

/* ── Request payload ─────────────────────────────────────────── */
export interface AnalyzeLeadsPayload {
  keyword: string;
  city: string;
  /** Empresas já coletadas (opcional — se vazio, simula coleta) */
  companies?: RawCompany[];
}
