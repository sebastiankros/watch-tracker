export interface ScrapedListing {
  title: string;
  price: number | null;
  url: string;
  source: string;
  condition: string;
  postedAgo: string;
}

export interface ScrapedMarketData {
  listings: ScrapedListing[];
  marketPrice: number | null;
  medianPrice: number | null;
  lowPrice: number | null;
  highPrice: number | null;
  sampleSize: number;
  scrapedAt: string;
}

// ===== Proxy layer =====

async function fetchViaScraperAPI(targetUrl: string, render: boolean): Promise<string> {
  const key = process.env.SCRAPER_API_KEY || '';
  if (!key) throw new Error('No SCRAPER_API_KEY');
  const renderParam = render ? '&render=true' : '';
  const proxyUrl = `https://api.scraperapi.com?api_key=${key}&url=${encodeURIComponent(targetUrl)}${renderParam}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`ScraperAPI ${res.status}`);
  return res.text();
}

async function fetchViaScrapingBee(targetUrl: string, render: boolean): Promise<string> {
  const key = process.env.SCRAPINGBEE_API_KEY || '';
  if (!key) throw new Error('No SCRAPINGBEE_API_KEY');
  const renderParam = render ? '&render_js=true' : '&render_js=false';
  const proxyUrl = `https://app.scrapingbee.com/api/v1/?api_key=${key}&url=${encodeURIComponent(targetUrl)}${renderParam}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`ScrapingBee ${res.status}`);
  return res.text();
}

async function fetchViaProxy(targetUrl: string, render = false): Promise<string> {
  if (process.env.SCRAPER_API_KEY) {
    try {
      return await fetchViaScraperAPI(targetUrl, render);
    } catch {
      // fall through
    }
  }
  if (process.env.SCRAPINGBEE_API_KEY) {
    return fetchViaScrapingBee(targetUrl, render);
  }
  throw new Error('No scraping API keys configured');
}

// ===== Junk filter =====

function isJunkListing(title: string): boolean {
  const lower = title.toLowerCase();
  const junkPatterns = [
    /\b(strap only|band only|bracelet only|clasp only|buckle only)\b/,
    /\b(rubber strap|leather strap|nato strap|canvas strap|nylon strap)\b(?!.*\b(watch|full set|complete|kit|box)\b)/,
    /\b(bezel insert|crystal replacement|crown only|caseback|dial only|hands only|movement only)\b/,
    /\b(spring bars?|watch tool|polishing cloth|repair kit)\b/,
    /\b(pouch|wallet|hat|shirt|book|magazine|catalog)\b/,
    /\b(half link|extra link|link only|end link|links for)\b/,
    /\b(display case|watch box only|watch roll)\b/,
    /\bfor parts\b/,
    /\bnot working\b/,
    /\bjunk\b/,
  ];
  for (const pattern of junkPatterns) {
    if (pattern.test(lower)) return true;
  }
  return false;
}

function relevanceCheck(query: string, title: string): boolean {
  const queryWords = query.toLowerCase().split(/\s+/);
  const titleLower = title.toLowerCase();
  const matchCount = queryWords.filter((w) => titleLower.includes(w)).length;
  return matchCount >= Math.min(2, queryWords.length);
}

function detectCondition(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(unworn|bnib|new.?in.?box|sealed|brand.?new)\b/.test(lower)) return 'New';
  if (/\b(mint|excellent|like.?new)\b/.test(lower)) return 'Excellent';
  if (/\b(very.?good|great.?condition)\b/.test(lower)) return 'Very Good';
  if (/\b(good|pre.?owned|used)\b/.test(lower)) return 'Good';
  if (/\b(fair|worn|scratches)\b/.test(lower)) return 'Fair';
  return 'Pre-Owned';
}

// ===== Chrono24 =====

export async function scrapeChrono24(query: string, maxPrice = 50000): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://www.chrono24.com/search/index.htm?query=${encoded}&dosearch=true&usedWhere=us&priceTo=${maxPrice}&priceFrom=500`;
  const html = await fetchViaProxy(targetUrl, false);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  // Strategy 1: JSON-LD @graph parsing
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const graph = data['@graph'] || [];
      for (const entry of graph) {
        if (!entry.offers) continue;
        const offers = Array.isArray(entry.offers) ? entry.offers : [entry.offers];
        for (const offer of offers) {
          if (!offer.name || !offer.price || !offer.url) continue;
          const title = String(offer.name).trim();
          const price = typeof offer.price === 'string' ? parseInt(offer.price, 10) : offer.price;
          const url = String(offer.url);
          const id = url.match(/--id(\d+)/)?.[1];
          if (id && seen.has(id)) continue;
          if (id) seen.add(id);
          if (!title || isJunkListing(title)) continue;
          if (price < 500 || price > maxPrice) continue;
          if (!relevanceCheck(query, title)) continue;
          listings.push({ title, price, url, source: 'Chrono24', condition: detectCondition(title), postedAgo: '' });
        }
      }
    } catch { /* fall through */ }
  }

  // Strategy 2: regex extraction from inline JSON
  if (listings.length === 0) {
    const offerBlocks = Array.from(html.matchAll(/"name":"([^"]+)"[\s\S]{0,300}?"price":"(\d+)"[\s\S]{0,300}?"url":"([^"]+)"/g));
    for (const match of offerBlocks) {
      const title = match[1].trim();
      const price = parseInt(match[2], 10);
      const url = match[3];
      if (!url.includes('chrono24.com')) continue;
      const id = url.match(/--id(\d+)/)?.[1];
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      if (!title || isJunkListing(title)) continue;
      if (price < 500 || price > maxPrice) continue;
      if (!relevanceCheck(query, title)) continue;
      listings.push({ title, price, url, source: 'Chrono24', condition: detectCondition(title), postedAgo: '' });
    }
  }

  return listings;
}

// ===== eBay =====

export async function scrapeEbay(query: string, maxPrice = 50000): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://www.ebay.com/sch/31387/i.html?_nkw=${encoded}&_sop=12&LH_ItemCondition=3000&LH_PrefLoc=1&_udhi=${maxPrice}&_udlo=500`;
  const html = await fetchViaProxy(targetUrl, false);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  // Primary: eBay uses srp-river-results with s-item__wrapper
  // Match more broadly — the HTML structure varies
  const items = Array.from(html.matchAll(/<li[^>]*class="[^"]*s-item[^"]*"[^>]*>([\s\S]*?)<\/li>/g));

  for (const item of items) {
    const block = item[1];

    // Title: multiple possible structures
    const titleMatch =
      block.match(/class="s-item__title"[^>]*>(?:<span[^>]*>)*([^<]+)/) ||
      block.match(/role="heading"[^>]*>(?:<span[^>]*>)*([^<]+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();
    if (!title || title === 'Shop on eBay' || title === 'Results matching fewer words') continue;

    // Price: multiple formats
    const priceMatch =
      block.match(/class="s-item__price"[^>]*>[^$]*\$([\d,]+(?:\.\d{2})?)/) ||
      block.match(/\$([\d,]+(?:\.\d{2})?)/);
    if (!priceMatch) continue;
    const rawPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (isNaN(rawPrice)) continue;
    const finalPrice = Math.round(rawPrice);

    // URL
    const urlMatch =
      block.match(/href="(https?:\/\/www\.ebay\.com\/itm\/[^"]+)"/) ||
      block.match(/class="s-item__link"[^>]*href="([^"]+)"/);
    if (!urlMatch) continue;
    const url = urlMatch[1].split('?')[0];

    // Deduplicate
    const itemId = url.match(/\/(\d+)(?:\?|$)/)?.[1] || url;
    if (seen.has(itemId)) continue;
    seen.add(itemId);

    if (isJunkListing(title)) continue;
    if (finalPrice < 500 || finalPrice > maxPrice) continue;
    if (!relevanceCheck(query, title)) continue;

    // Condition from eBay
    const condMatch = block.match(/class="[^"]*SECONDARY_INFO[^"]*"[^>]*>([^<]+)/);
    const condition = condMatch ? condMatch[1].trim() : detectCondition(title);

    listings.push({ title, price: finalPrice, url, source: 'eBay', condition, postedAgo: '' });
  }

  return listings;
}

// ===== eBay Sold Listings (for real market value) =====

export async function scrapeEbaySold(query: string, maxPrice = 50000): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://www.ebay.com/sch/31387/i.html?_nkw=${encoded}&LH_Complete=1&LH_Sold=1&_udhi=${maxPrice}&_udlo=500`;
  const html = await fetchViaProxy(targetUrl, false);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();
  const items = Array.from(html.matchAll(/<li[^>]*class="[^"]*s-item[^"]*"[^>]*>([\s\S]*?)<\/li>/g));

  for (const item of items) {
    const block = item[1];
    const titleMatch = block.match(/class="s-item__title"[^>]*>(?:<span[^>]*>)*([^<]+)/) ||
      block.match(/role="heading"[^>]*>(?:<span[^>]*>)*([^<]+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();
    if (!title || title === 'Shop on eBay') continue;

    const priceMatch = block.match(/class="s-item__price"[^>]*>[^$]*\$([\d,]+(?:\.\d{2})?)/) ||
      block.match(/\$([\d,]+(?:\.\d{2})?)/);
    if (!priceMatch) continue;
    const finalPrice = Math.round(parseFloat(priceMatch[1].replace(/,/g, '')));
    if (isNaN(finalPrice) || finalPrice < 500 || finalPrice > maxPrice) continue;

    const urlMatch = block.match(/href="(https?:\/\/www\.ebay\.com\/itm\/[^"]+)"/);
    const url = urlMatch ? urlMatch[1].split('?')[0] : '';
    const itemId = url.match(/\/(\d+)$/)?.[1] || `sold_${seen.size}`;
    if (seen.has(itemId)) continue;
    seen.add(itemId);

    if (isJunkListing(title)) continue;
    if (!relevanceCheck(query, title)) continue;

    listings.push({ title, price: finalPrice, url, source: 'eBay Sold', condition: detectCondition(title), postedAgo: '' });
  }

  return listings;
}

// ===== Watchfinder =====

export async function scrapeWatchfinder(query: string, maxPrice = 50000): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://www.watchfinder.com/search?q=${encoded}&currency=USD`;
  const html = await fetchViaProxy(targetUrl, false);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  // Try JSON-LD product data first
  const jsonLdBlocks = Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g));
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const items = Array.isArray(data) ? data : data['@graph'] || [data];
      for (const item of items) {
        if (item['@type'] !== 'Product') continue;
        const title = item.name?.trim();
        const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        if (!offer || !title) continue;
        const price = Math.round(typeof offer.price === 'string' ? parseFloat(offer.price) : offer.price);
        const url = item.url || offer.url;
        if (!price || !url || price < 500 || price > maxPrice) continue;
        const key = url.replace(/[?#].*$/, '');
        if (seen.has(key)) continue;
        seen.add(key);
        if (isJunkListing(title) || !relevanceCheck(query, title)) continue;
        listings.push({
          title, price,
          url: url.startsWith('http') ? url : `https://www.watchfinder.com${url}`,
          source: 'Watchfinder', condition: detectCondition(title + ' ' + (item.description || '')), postedAgo: '',
        });
      }
    } catch { /* skip */ }
  }

  // Fallback: regex patterns for product cards
  if (listings.length === 0) {
    const cards = Array.from(html.matchAll(/<a[^>]*href="([^"]*\/watches\/[^"]*)"[^>]*>[\s\S]*?<\/a>/g));
    for (const card of cards) {
      const cardHtml = card[0];
      const path = card[1];
      const titleMatch = cardHtml.match(/alt="([^"]+)"/) || cardHtml.match(/>([^<]{10,})</);
      if (!titleMatch) continue;
      const title = titleMatch[1].trim();
      const priceMatch = cardHtml.match(/[\$£]([\d,]+)/);
      if (!priceMatch) continue;
      const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      if (price < 500 || price > maxPrice) continue;
      const key = path;
      if (seen.has(key)) continue;
      seen.add(key);
      if (isJunkListing(title) || !relevanceCheck(query, title)) continue;
      listings.push({
        title, price,
        url: path.startsWith('http') ? path : `https://www.watchfinder.com${path}`,
        source: 'Watchfinder', condition: detectCondition(title), postedAgo: '',
      });
    }
  }

  return listings;
}

// ===== Jomashop =====

export async function scrapeJomashop(query: string, maxPrice = 50000): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://www.jomashop.com/catalogsearch/result?q=${encoded}`;
  const html = await fetchViaProxy(targetUrl, false);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  // JSON-LD
  const jsonLdBlocks = Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g));
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] !== 'Product') continue;
        const title = item.name?.trim();
        const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        if (!offer || !title) continue;
        const price = Math.round(typeof offer.price === 'string' ? parseFloat(offer.price) : offer.price);
        const url = item.url || offer.url;
        if (!price || !url || price < 500 || price > maxPrice) continue;
        const key = url.replace(/[?#].*$/, '');
        if (seen.has(key)) continue;
        seen.add(key);
        if (isJunkListing(title) || !relevanceCheck(query, title)) continue;
        listings.push({
          title, price,
          url: url.startsWith('http') ? url : `https://www.jomashop.com${url}`,
          source: 'Jomashop', condition: 'New', postedAgo: '',
        });
      }
    } catch { /* skip */ }
  }

  // Fallback: look for product data in HTML
  if (listings.length === 0) {
    const products = Array.from(html.matchAll(/<a[^>]*href="(https?:\/\/www\.jomashop\.com\/[^"]*\.html)"[^>]*>([\s\S]*?)<\/a>/g));
    for (const product of products) {
      const url = product[1];
      const inner = product[2];
      const titleMatch = inner.match(/alt="([^"]+)"/) || inner.match(/>([^<]{10,})</);
      if (!titleMatch) continue;
      const title = titleMatch[1].trim();
      const priceMatch = inner.match(/\$([\d,]+(?:\.\d{2})?)/);
      if (!priceMatch) continue;
      const price = Math.round(parseFloat(priceMatch[1].replace(/,/g, '')));
      if (price < 500 || price > maxPrice) continue;
      const key = url.replace(/[?#].*$/, '');
      if (seen.has(key)) continue;
      seen.add(key);
      if (isJunkListing(title) || !relevanceCheck(query, title)) continue;
      listings.push({ title, price, url, source: 'Jomashop', condition: 'New', postedAgo: '' });
    }
  }

  return listings;
}

// ===== Combined =====

/**
 * Scrape marketplaces. Default: Chrono24 only (1 credit per watch).
 * Pass allSources=true for full sweep (4 credits per watch) — used during manual refresh.
 */
export async function scrapeAllMarketplaces(query: string, maxPrice = 50000, allSources = false): Promise<ScrapedListing[]> {
  if (!process.env.SCRAPER_API_KEY && !process.env.SCRAPINGBEE_API_KEY) return [];

  // Chrono24 always fires (primary source, ~57 listings per query)
  const promises: Promise<ScrapedListing[]>[] = [
    scrapeChrono24(query, maxPrice).catch(() => [] as ScrapedListing[]),
  ];

  // Additional sources only when requested (manual refresh) to save credits
  if (allSources) {
    promises.push(
      scrapeEbay(query, maxPrice).catch(() => [] as ScrapedListing[]),
      scrapeWatchfinder(query, maxPrice).catch(() => [] as ScrapedListing[]),
      scrapeJomashop(query, maxPrice).catch(() => [] as ScrapedListing[]),
    );
  }

  const results = await Promise.all(promises);
  const allListings = results.flat();

  // Deduplicate by cleaned URL
  const seen = new Set<string>();
  const combined: ScrapedListing[] = [];
  for (const listing of allListings) {
    const key = listing.url.replace(/[?#].*$/, '').replace(/\/+$/, '');
    if (seen.has(key)) continue;
    seen.add(key);
    combined.push(listing);
  }

  return combined;
}

export function getMarketplaceSearchUrls(query: string) {
  const encoded = encodeURIComponent(query);
  return {
    chrono24: `https://www.chrono24.com/search/index.htm?query=${encoded}&dosearch=true&usedWhere=us`,
    ebay: `https://www.ebay.com/sch/31387/i.html?_nkw=${encoded}&LH_ItemCondition=3000&LH_PrefLoc=1`,
    watchfinder: `https://www.watchfinder.com/search?q=${encoded}&currency=USD`,
    jomashop: `https://www.jomashop.com/catalogsearch/result?q=${encoded}`,
  };
}

export function calculateMarketStats(listings: ScrapedListing[], minPrice = 500, maxPrice = 50000) {
  const validPrices = listings
    .filter((l) => l.price && l.price >= minPrice && l.price <= maxPrice)
    .map((l) => l.price as number)
    .sort((a, b) => a - b);

  if (validPrices.length === 0) {
    return { marketPrice: null, medianPrice: null, lowPrice: null, highPrice: null, sampleSize: 0 };
  }

  const trimStart = Math.floor(validPrices.length * 0.1);
  const trimEnd = Math.ceil(validPrices.length * 0.9);
  const trimmed = validPrices.length >= 5 ? validPrices.slice(trimStart, trimEnd) : validPrices;
  const median = trimmed[Math.floor(trimmed.length / 2)];
  const avg = Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);

  return { marketPrice: avg, medianPrice: median, lowPrice: validPrices[0], highPrice: validPrices[validPrices.length - 1], sampleSize: validPrices.length };
}

export async function scrapeWatch(query: string, maxPrice = 50000): Promise<ScrapedMarketData> {
  const activeListings = await scrapeAllMarketplaces(query, maxPrice).catch(() => [] as ScrapedListing[]);
  const stats = calculateMarketStats(activeListings, 500, maxPrice);
  return { listings: activeListings, ...stats, scrapedAt: new Date().toISOString() };
}
