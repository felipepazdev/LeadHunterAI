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

    // ── MODO BUSCA GERAL (SERPAPI - GOOGLE MAPS EXCLUSIVO) ──────────────────
    if (!isOpportunityMode && serpapiKey) {
      try {
        console.log(`[LeadCollector] BUSCA GERAL (Maps): Usando SerpApi para: ${keyword} em ${city}`);
        
        // 1. Tentar Buscar no Google Maps Primeiro (Fiel ao print)
        const mapsUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(keyword)} ${encodeURIComponent(city)}&hl=pt-br&gl=br&google_domain=google.com.br&type=search&api_key=${serpapiKey}`;
        const mapsResp = await fetch(mapsUrl);
        const mapsJson = await mapsResp.json() as any;

        const results: RawCompany[] = [];

        if (mapsJson.local_results) {
          mapsJson.local_results.forEach((item: any) => {
             const cleanName = (item.title || item.name || '').split(/[-|]/)[0]?.trim();
             if (!cleanName || cleanName.length < 3) return;

             const rawUrl = (item.website || '').toLowerCase();
             const isInstagram = rawUrl.includes('instagram.com');
             const isSocialOrDir = ['facebook.com','linkedin.com','guiamais.com.br','doctoralia.com','telelistas.net','cnpj.biz'].some(d => rawUrl.includes(d));

             results.push({
               name: cleanName,
               phone: item.phone || null,
               website: (isInstagram || isSocialOrDir || !rawUrl) ? null : rawUrl,
               instagram: isInstagram ? rawUrl : null,
               googleMapsLink: item.link || `https://maps.google.com/?q=${encodeURIComponent(item.gps_coordinates?.latitude + ',' + item.gps_coordinates?.longitude || cleanName + ' ' + city)}`,
               address: item.address || `${city} (Maps)`,
               rating: item.rating || 0,
               reviewsCount: item.reviews || 0,
               isSponsored: false
             });
          });
        }

        // 2. Fallback: Se o Maps por algum motivo não trouxer nada, tenta busca orgânica (Web) filtrando lixo
        if (results.length === 0) {
           console.log(`[LeadCollector] Fallback: Maps vazio, tentando Busca Web para ${keyword} em ${city}...`);
           const webUrl = `https://serpapi.com/search.json?engine=google&q=lista+de+${encodeURIComponent(keyword)}+em+${encodeURIComponent(city)}&hl=pt-br&gl=br&google_domain=google.com.br&api_key=${serpapiKey}`;
           const webResp = await fetch(webUrl);
           const webJson = await webResp.json() as any;

           if (webJson.local_results) {
             webJson.local_results.forEach((item: any) => {
                const cleanName = (item.title || item.name || '').split(/[-|]/)[0]?.trim();
                if (!cleanName || cleanName.length < 3) return;
                results.push({
                   name: cleanName,
                   phone: item.phone || null,
                   website: item.website || null,
                   instagram: (item.website||'').includes('instagram') ? item.website : null,
                   googleMapsLink: item.link || `https://maps.google.com/?q=${encodeURIComponent(cleanName + ' ' + city)}`,
                   address: item.address || `${city} (Web)`,
                   rating: item.rating || 4.5,
                   reviewsCount: item.reviews || 10,
                   isSponsored: false
                });
             });
           }
        }

        return results;
      } catch (err) { console.error('[LeadCollector] SerpApi Google Maps Error:', err); }
    }

    return [];
  }
}
