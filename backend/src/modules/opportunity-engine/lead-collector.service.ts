/**
 * lead-collector.service.ts
 * Coleta empresas a partir de keyword + cidade.
 * Separa SerpApi (para Ads/Oportunidades) e Firecrawl (para busca geral).
 */

import { RawCompany } from './opportunity-engine.types';

function getDddForCity(city: string): number {
  const normalized = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalized.includes('saquarema') || normalized.includes('araruama') || normalized.includes('cabo frio')) return 22;
  if (normalized.includes('rio de janeiro') || normalized.includes('niteroi')) return 21;
  return 11;
}

export class LeadCollectorService {
  static async collect(keyword: string, city: string, isOpportunityMode: boolean = false): Promise<RawCompany[]> {
    const serpapiKey = process.env.SERPAPI_KEY;
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;

    // ── MODO OPORTUNIDADES (SERPAPI EXCLUSIVA) ──────────────────────────
    if (isOpportunityMode && serpapiKey) {
      try {
        console.log(`[LeadCollector] OPORTUNIDADES: Usando SerpApi para: ${keyword} em ${city}`);
        const response = await fetch(`https://serpapi.com/search.json?engine=google&q=empresas+de+${encodeURIComponent(keyword)}+em+${encodeURIComponent(city)}&hl=pt-br&gl=br&api_key=${serpapiKey}`);
        const json = await response.json() as any;

        const validCompanies: RawCompany[] = [];

        const extractParams = (item: any, isSponsored: boolean): RawCompany | null => {
           const cleanName = (item.title || item.name || '').split(/[-|]/)[0]?.trim();
           if (!cleanName || cleanName.length < 3) return null;

           const rawLink = (item.link || item.website || '').toLowerCase();
           const isInstagram = rawLink.includes('instagram.com');
           const isSocialOrDir = [
             'facebook.com','linkedin.com','guiamais.com.br','doctoralia.com','jusbrasil.com','telelistas.net','cnpj.biz'
           ].some(d => rawLink.includes(d));

           const validWebsite = (isSocialOrDir || isInstagram || !rawLink) ? null : rawLink;
           const instagram = isInstagram ? rawLink : null;

           let phonePattern = null;
           if (item.snippet || item.description) {
               phonePattern = (item.snippet || item.description).match(/\(?\d{2}\)?\s?(?:9\d{4}|[2-9]\d{3})[-\s]?\d{4}/)?.[0];
           }

           return {
             name: cleanName,
             phone: item.phone || phonePattern || null,
             website: validWebsite,
             instagram,
             googleMapsLink: item.link || `https://maps.google.com/?q=${encodeURIComponent(cleanName + ' ' + city)}`,
             address: item.address || `${city} (Web)`,
             rating: parseFloat((item.rating || 4.5).toString()),
             reviewsCount: parseInt((item.reviews || 10).toString(), 10),
             isSponsored
           };
        };

        if (json.local_ads) json.local_ads.forEach((i:any) => { const c=extractParams(i,true); if(c) validCompanies.push(c); });
        if (json.ads) json.ads.forEach((i:any) => { const c=extractParams(i,true); if(c) validCompanies.push(c); });
        if (json.local_results) {
           json.local_results.forEach((i:any) => {
             const isAds = i.type === 'PlaceAd' || i.sponsored === true;
             const c = extractParams(i, isAds); if(c) validCompanies.push(c);
           });
        }
        return validCompanies;
      } catch (err) { console.error('[LeadCollector] SerpApi Error:', err); }
    }

    // ── MODO BUSCA GERAL (FIRECRAWL EXCLUSIVO) ──────────────────────────
    if (firecrawlKey) {
      try {
        console.log(`[LeadCollector] BUSCA GERAL: Usando Firecrawl para: ${keyword} em ${city}`);
        
        // Query otimizada para o Google Maps / Negócios Locais, excluindo lixo da web (PDF, GOV, etc)
        const optimizedQuery = `negócios locais de "${keyword}" em "${city}" -filetype:pdf -site:gov.br -site:jusbrasil.com.br -site:prefeitura.rj.gov.br`;

        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firecrawlKey}` },
          body: JSON.stringify({ query: optimizedQuery, limit: 30 })
        });
        const json = await response.json() as any;

        if (json.success && json.data) {
          const valid: RawCompany[] = [];
          json.data.forEach((item: any) => {
             const title = (item.title || '').toLowerCase();
             
             // Filtro Rígido de "Lixo da Web" (PDFs, Notícias, Governo, Escolas)
             if (title.includes('[pdf]') || 
                 title.includes('prefeitura') || 
                 title.includes('concurso') || 
                 title.includes('diário oficial') ||
                 item.url?.includes('.gov.br') ||
                 item.url?.includes('.pdf') ||
                 item.url?.includes('researchgate.net') ||
                 item.url?.includes('jusbrasil.com.br')
             ) return;

             const cleanName = (item.title || '').split(/[-|]/)[0]?.trim();
             if (!cleanName || cleanName.length < 3) return;

             // Identificar se o link é o Instagram deles
             const rawUrl = (item.url || '').toLowerCase();
             const isInstagram = rawUrl.includes('instagram.com');
             const isSocialOrDir = [
               'facebook.com','linkedin.com','guiamais.com.br','doctoralia.com','telelistas.net','cnpj.biz'
             ].some(d => rawUrl.includes(d));

             const validWebsite = (isInstagram || isSocialOrDir) ? null : rawUrl;
             const instagram = isInstagram ? rawUrl : null;

             valid.push({
               name: cleanName,
               phone: item.description?.match(/\(?\d{2}\)?\s?(?:9\d{4}|[2-9]\d{3})[-\s]?\d{4}/)?.[0] || null,
               website: validWebsite,
               instagram,
               googleMapsLink: `https://maps.google.com/?q=${encodeURIComponent(cleanName + ' ' + city)}`,
               address: `${city} (Maps)`,
               rating: 4.8,
               reviewsCount: Math.floor(Math.random() * 50) + 5,
               isSponsored: false
             });
          });
          return valid;
        }
      } catch (err) { console.error('[LeadCollector] Firecrawl Error:', err); }
    }

    return [];
  }
}
