/**
 * lead-collector.service.ts
 * Coleta empresas a partir de keyword + cidade.
 * Mock realista — em produção, integrar com SerpAPI/scraper real.
 */

import { RawCompany } from './opportunity-engine.types';

const BUSINESS_TYPES: Record<string, string[]> = {
  default: ['Ltda', 'ME', 'EIRELI', 'S/A', '& Filhos', 'e Associados'],
};

export class LeadCollectorService {
  static async collect(keyword: string, city: string): Promise<RawCompany[]> {
    const count = Math.floor(Math.random() * 5) + 6; // 6-10 empresas

    return Array.from({ length: count }, (_, i) => {
      const rating = parseFloat((3.0 + Math.random() * 2.0).toFixed(1));
      const hasWebsite = Math.random() > 0.25; // 75% têm site

      const suffixes = BUSINESS_TYPES.default;
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

      return {
        name:           `${keyword} ${suffix} #${i + 1}`,
        phone:          `(${10 + Math.floor(Math.random() * 88)}) 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
        website:        hasWebsite ? `https://${keyword.toLowerCase().replace(/\s+/g, '')}${i + 1}.com.br` : null,
        googleMapsLink: `https://maps.google.com/?q=${encodeURIComponent(keyword + ' ' + city)}`,
        address:        `Av. ${['Brasil', 'Paulista', 'Principal', 'das Américas'][i % 4]}, ${100 + i * 12} — ${city}`,
        rating,
        reviewsCount:   Math.floor(Math.random() * 900 + 5),
      };
    });
  }
}
