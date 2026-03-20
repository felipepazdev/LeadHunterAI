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
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;

    // Se tiver chave do Firecrawl configurada, busca na vida real
    if (firecrawlKey) {
      try {
        console.log(`[LeadCollector] Usando Firecrawl (Real Data) para: ${keyword} em ${city}`);
        
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firecrawlKey}`
          },
          body: JSON.stringify({
            query: `empresas ${keyword} em ${city} site oficial e contatos`,
            limit: 7, // Limita para não demorar tanto
            scrapeOptions: {
              formats: ["json"],
              jsonOptions: {
                prompt: `Extraia o site real, o telefone de contato (WhatsApp ou linha fixa), e endereço desta empresa que apareceu nos resultados. Se não houver clareza, deixe vazio.`,
                schema: {
                  type: "object",
                  properties: {
                    phone: { type: "string" },
                    address: { type: "string" },
                    rating: { type: "number" }
                  }
                }
              }
            }
          })
        });

        const json = await response.json() as any;

        if (json.success && json.data && json.data.length > 0) {
          const realCompanies: RawCompany[] = json.data.map((item: any) => {
             const extracted = item.json || {};
             const cleanName = item.title ? item.title.split('-')[0].split('|')[0].trim() : keyword;
             return {
               name: cleanName,
               phone: extracted.phone || null,
               website: item.url || null,
               googleMapsLink: `https://maps.google.com/?q=${encodeURIComponent(cleanName + ' ' + city)}`,
               address: extracted.address || `${city} (endereço não lido)`,
               rating: extracted.rating || parseFloat((4.0 + Math.random() * 1.0).toFixed(1)), // mocka a nota caso o site não revele
               reviewsCount: Math.floor(Math.random() * 300) + 10,
             } as RawCompany;
          });

          // Filtra resultados genéricos como instagram.com ou linkedin.com para manter só empresas locais ou as que parecem ser reais
          const validCompanies = realCompanies.filter(c => 
            c.website && !c.website.includes('instagram.com') && !c.website.includes('facebook.com')
          );

          if (validCompanies.length > 0) {
            console.log(`[LeadCollector] Encontradas ${validCompanies.length} empresas reais.`);
            return validCompanies;
          }
          console.log('[LeadCollector] Resultados da busca foram muito genéricos, caindo no fallback.');
        } else {
          console.warn('[LeadCollector] Busca Firecrawl não retornou sucesso. Caindo no fallback.', json.error);
        }
      } catch (err) {
        console.error('[LeadCollector] Erro ao integrar com Firecrawl:', err);
      }
    }

    // FALLBACK (Mock Realista)
    const count = Math.floor(Math.random() * 5) + 6; // 6-10 empresas
    const ddd = getDddForCity(city);

    return Array.from({ length: count }, (_, i) => {
      const rating = parseFloat((3.0 + Math.random() * 2.0).toFixed(1));
      const hasWebsite = Math.random() > 0.25; // 75% têm site

      const suffixes = BUSINESS_TYPES.default;
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

      const prefixes = ['Silva', 'Cunha', 'Tech', 'Nova', 'Solução', 'Elite', 'Global', 'Líder', 'Master', 'Excellence', 'Premium', 'Prime'];
      const prefix = prefixes[(i * 3 + keyword.length) % prefixes.length];

      const businessName = `${prefix} ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} ${suffix}`;

      return {
        name:           businessName,
        phone:          `(${ddd}) 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
        website:        hasWebsite ? `https://${prefix.toLowerCase().replace(/[í]/g, 'i').replace(/[ç]/g, 'c')}${keyword.toLowerCase().replace(/\s+/g, '')}.com.br` : null,
        googleMapsLink: `https://maps.google.com/?q=${encodeURIComponent(businessName + ' ' + city)}`,
        address:        `Av. ${['Brasil', 'Paulista', 'Principal', 'das Américas'][i % 4]}, ${100 + i * 12} — ${city}`,
        rating,
        reviewsCount:   Math.floor(Math.random() * 900 + 5),
      };
    });
  }
}
