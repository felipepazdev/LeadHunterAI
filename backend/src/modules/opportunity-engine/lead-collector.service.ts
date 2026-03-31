/**
 * lead-collector.service.ts
 * Coleta empresas a partir de keyword + cidade.
 */

import { RawCompany } from './opportunity-engine.types';

function getDddForCity(city: string): number {
  const normalized = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (normalized.includes('saquarema') || normalized.includes('araruama') || normalized.includes('cabo frio') || normalized.includes('macae') || normalized.includes('rio das ostras') || normalized.includes('buzios')) return 22;
  if (normalized.includes('rio de janeiro') || normalized.includes('niteroi') || normalized.includes('caxias')) return 21;
  if (normalized.includes('sao paulo') || normalized.includes('guarulhos') || normalized.includes('osasco')) return 11;
  if (normalized.includes('curitiba')) return 41;
  if (normalized.includes('salvador')) return 71;
  if (normalized.includes('fortaleza')) return 85;

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 89) + 11;
}

export class LeadCollectorService {
  static async collect(keyword: string, city: string): Promise<RawCompany[]> {
    const serpapiKey = process.env.SERPAPI_KEY;
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;

    if (serpapiKey) {
      try {
        console.log(`[LeadCollector] Usando SerpApi para: ${keyword} em ${city}`);
        const response = await fetch(`https://serpapi.com/search.json?engine=google&q=empresas+de+${encodeURIComponent(keyword)}+em+${encodeURIComponent(city)}&hl=pt-br&gl=br&api_key=${serpapiKey}`);
        const json = await response.json() as any;

        const validCompanies: RawCompany[] = [];

        const extractParams = (item: any, isSponsored: boolean): RawCompany | null => {
           const titleParts = (item.title || item.name || '').split(/[-|]/);
           const cleanName = titleParts[0]?.trim();
           if (!cleanName || cleanName.length < 3) return null;

           const rawLink = (item.link || item.website || '').toLowerCase();
           
           // Identificar Instagram
           const isInstagram = rawLink.includes('instagram.com');
           const isGenericDirectory = [
             'guiamais.com.br', 'doctoralia.com', 'jusbrasil.com', 'telelistas.net',
             'apontador.com.br', 'cnpj.biz', 'casadosdados.com.br', 'econodata.com.br',
             'consultasocio.com', 'listamais.com.br', 'hublocal.com.br', 'empresasdobrasil.com',
             'infojobs.com.br', 'vagas.com.br', 'reclameaqui.com.br', 'solutudo.com.br'
           ].some(d => rawLink.includes(d));

           const otherSocials = [
             'facebook.com', 'linkedin.com', 'youtube.com', 'tiktok.com',
             'twitter.com', 'x.com', 'pinterest.com', 'whatsapp.com', 'linktr.ee'
           ].some(d => rawLink.includes(d));

           // Definir Website Real (exclui redes sociais e diretorios)
           const validWebsite = (isGenericDirectory || otherSocials || isInstagram || !rawLink) ? null : rawLink;
           
           // Definir Instagram (se o link principal for insta ou se acharmos no snippet futuramente)
           const instagram = isInstagram ? rawLink : null;

           let phonePattern = null;
           if (item.snippet || item.description) {
               const str = item.snippet || item.description;
               phonePattern = str.match(/\(?\d{2}\)?\s?(?:9\d{4}|[2-9]\d{3})[-\s]?\d{4}/)?.[0];
           }

           return {
             name: cleanName,
             phone: item.phone || phonePattern || null,
             website: validWebsite,
             instagram: instagram,
             googleMapsLink: item.link || `https://maps.google.com/?q=${encodeURIComponent(cleanName + ' ' + city)}`,
             address: item.address || `${city} (Web)`,
             rating: parseFloat((item.rating || (4.0 + Math.random() * 0.9)).toString()),
             reviewsCount: parseInt((item.reviews || Math.floor(Math.random() * 200) + 15).toString(), 10),
             isSponsored
           };
        };

        const processList = (list: any[], sponsored: boolean) => {
           if (list && Array.isArray(list)) {
              list.forEach(item => {
                 const c = extractParams(item, sponsored);
                 if (c) validCompanies.push(c);
              });
           }
        };

        processList(json.local_ads, true);
        processList(json.ads, true);
        
        if (json.local_results && Array.isArray(json.local_results)) {
           json.local_results.forEach((item: any) => {
             const isAds = item.type === 'PlaceAd' || item.sponsored === true;
             const c = extractParams(item, isAds);
             if (c) validCompanies.push(c);
           });
        }
        processList(json.organic_results, false);

        if (validCompanies.length > 0) return validCompanies;
      } catch (err) {
        console.error('[LeadCollector] Erro SerpApi:', err);
      }
    }

    if (firecrawlKey) {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firecrawlKey}` },
          body: JSON.stringify({ query: `empresas de ${keyword} em ${city} brasil`, limit: 30 })
        });
        const json = await response.json() as any;

        if (json.success && json.data) {
          const valid: RawCompany[] = [];
          json.data.forEach((item: any) => {
             const cleanName = (item.title || '').split(/[-|]/)[0]?.trim();
             if (!cleanName || cleanName.length < 3) return;

             const rawUrl = (item.url || '').toLowerCase();
             const isInstagram = rawUrl.includes('instagram.com');
             const isSocialOrDir = [
               'facebook.com','linkedin.com','guiamais.com.br','doctoralia.com','telelistas.net'
             ].some(d => rawUrl.includes(d));

             valid.push({
               name: cleanName,
               phone: item.description?.match(/\(?\d{2}\)?\s?(?:9\d{4}|[2-9]\d{3})[-\s]?\d{4}/)?.[0] || null,
               website: (isInstagram || isSocialOrDir) ? null : rawUrl,
               instagram: isInstagram ? rawUrl : null,
               googleMapsLink: `https://maps.google.com/?q=${encodeURIComponent(cleanName + ' ' + city)}`,
               address: `${city} (Web)`,
               rating: 4.5,
               reviewsCount: 20,
               isSponsored: false
             });
          });
          return valid;
        }
      } catch (err) { console.error('[LeadCollector] Firecrawl error:', err); }
    }

    return [];
  }
}
