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
    // v1.1 - Force Deploy - Debug: Search results for ${keyword} in ${city}
    console.log(`[LeadCollector] INICIANDO COLETA: ${keyword} em ${city} (Modo: ${isOpportunityMode ? 'Oportunidades' : 'Geral'})`);
    
    if (!serpapiKey) {
      console.error('[LeadCollector] CRÍTICO: SERPAPI_KEY não configurada no backend!');
      return [];
    }
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

    // ── MODO BUSCA GERAL (MÁXIMA RESILIÊNCIA: MAPS + WEB) ──────────────────
    if (!isOpportunityMode && serpapiKey) {
      try {
        console.log(`[LeadCollector] BUSCA GERAL RESILIENTE: ${keyword} em ${city}`);
        const results: RawCompany[] = [];

        // 1. Tentar Google Maps (Nativo)
        const mapsUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(keyword)}+${encodeURIComponent(city)}&hl=pt-br&gl=br&type=search&api_key=${serpapiKey}`;
        const mapsResp = await fetch(mapsUrl);
        const mapsJson = await mapsResp.json() as any;

        if (mapsJson.local_results && mapsJson.local_results.length > 0) {
          console.log(`[LeadCollector] Encontrados ${mapsJson.local_results.length} leads no Maps.`);
          mapsJson.local_results.forEach((item: any) => {
             results.push({
               name: (item.title || item.name || 'Empresa sem Nome').split(/[-|]/)[0]?.trim(),
               phone: item.phone || null,
               website: (item.website||'').includes('instagram') || (item.website||'').includes('facebook') ? null : (item.website || null),
               instagram: (item.website||'').includes('instagram') ? item.website : null,
               googleMapsLink: item.link || `https://www.google.com/maps/search/${encodeURIComponent(keyword + ' ' + city)}`,
               address: item.address || city,
               rating: item.rating || 0,
               reviewsCount: item.reviews || 0,
               isSponsored: false
             });
          });
        }

        // 2. Se o Maps trouxe pouco ou nada, buscar no Google Web Local (tbm=lcl)
        if (results.length < 5) {
          console.log(`[LeadCollector] Maps insuficiente (${results.length}), buscando via Google Search Local (tbm=lcl)...`);
          const webUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword + ' ' + city)}&tbm=lcl&hl=pt-br&gl=br&api_key=${serpapiKey}`;
          const webResp = await fetch(webUrl);
          const webJson = await webResp.json() as any;

          if (webJson.local_results) {
            console.log(`[LeadCollector] Fallback (Local Web) trouxe ${webJson.local_results.length} resultados.`);
            webJson.local_results.forEach((item: any) => {
               const name = (item.title || item.name || '').split(/[-|]/)[0]?.trim();
               if (!results.some(r => r.name.toLowerCase() === name.toLowerCase())) {
                 results.push({
                   name,
                   phone: item.phone || null,
                   website: (item.link||'').includes('instagram') ? null : (item.link || null),
                   instagram: (item.link||'').includes('instagram') ? item.link : null,
                   googleMapsLink: `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + city)}`,
                   address: item.address || city,
                   rating: item.rating || 4.5,
                   reviewsCount: item.reviews || 10,
                   isSponsored: false
                 });
               }
            });
          }
        }

        console.log(`[LeadCollector] Coleta finalizada com ${results.length} resultados.`);
        return results;
      } catch (err) { 
        console.error('[LeadCollector] Erro Crítico na Coleta SerpApi:', err);
        return [];
      }
    }

    return [];
  }
}
