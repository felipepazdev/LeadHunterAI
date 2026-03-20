/**
 * lead-collector.service.ts
 * Coleta empresas a partir de keyword + cidade.
 * Mock realista — em produção, integrar com SerpAPI/scraper real.
 */

import { RawCompany } from './opportunity-engine.types';

const BUSINESS_TYPES: Record<string, string[]> = {
  default: ['Ltda', 'ME', 'EIRELI', 'S/A', '& Filhos', 'e Associados'],
};

function getDddForCity(city: string): number {
  const normalized = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (normalized.includes('saquarema') || normalized.includes('araruama') || normalized.includes('cabo frio') || normalized.includes('macae') || normalized.includes('rio das ostras') || normalized.includes('buzios')) return 22;
  if (normalized.includes('rio de janeiro') || normalized.includes('niteroi') || normalized.includes('caxias')) return 21;
  if (normalized.includes('sao paulo') || normalized.includes('guarulhos') || normalized.includes('osasco')) return 11;
  if (normalized.includes('campinas') || normalized.includes('piracicaba')) return 19;
  if (normalized.includes('belo horizonte') || normalized.includes('contagem')) return 31;
  if (normalized.includes('uberlandia')) return 34;
  if (normalized.includes('juiz de fora')) return 32;
  if (normalized.includes('curitiba')) return 41;
  if (normalized.includes('londrina') || normalized.includes('maringa')) return 43;
  if (normalized.includes('porto alegre')) return 51;
  if (normalized.includes('caxias do sul')) return 54;
  if (normalized.includes('salvador')) return 71;
  if (normalized.includes('fortaleza')) return 85;
  if (normalized.includes('recife')) return 81;
  if (normalized.includes('brasilia')) return 61;
  if (normalized.includes('goiania')) return 62;
  if (normalized.includes('manaus')) return 92;
  if (normalized.includes('belem')) return 91;

  // Gera um DDD "aleatório" mas consistente para a cidade entre 11 e 99
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 89) + 11;
}

export class LeadCollectorService {
  static async collect(keyword: string, city: string): Promise<RawCompany[]> {
    const count = Math.floor(Math.random() * 5) + 6; // 6-10 empresas
    const ddd = getDddForCity(city);

    return Array.from({ length: count }, (_, i) => {
      const rating = parseFloat((3.0 + Math.random() * 2.0).toFixed(1));
      const hasWebsite = Math.random() > 0.25; // 75% têm site

      const suffixes = BUSINESS_TYPES.default;
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

      return {
        name:           `${keyword} ${suffix} #${i + 1}`,
        phone:          `(${ddd}) 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
        website:        hasWebsite ? `https://${keyword.toLowerCase().replace(/\s+/g, '')}${i + 1}.com.br` : null,
        googleMapsLink: `https://maps.google.com/?q=${encodeURIComponent(keyword + ' ' + city)}`,
        address:        `Av. ${['Brasil', 'Paulista', 'Principal', 'das Américas'][i % 4]}, ${100 + i * 12} — ${city}`,
        rating,
        reviewsCount:   Math.floor(Math.random() * 900 + 5),
      };
    });
  }
}
