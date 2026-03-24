export interface ScrapedListing {
  title: string;
  price: number | null;
  url: string;
  source: string;
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

/**
 * Fetch via ScraperAPI using native fetch()
 * Uses direct string interpolation (not URLSearchParams) to avoid encoding issues with API keys.
 */
async function fetchViaScraperAPI(targetUrl: string, render: boolean): Promise<string> {
  const key = process.env.SCRAPER_API_KEY || '';
  if (!key) throw new Error('No SCRAPER_API_KEY');
  const renderParam = render ? '&render=true' : '';
  const proxyUrl = `https://api.scraperapi.com?api_key=${key}&url=${encodeURIComponent(targetUrl)}${renderParam}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`ScraperAPI ${res.status}`);
  return res.text();
}

/**
 * Fetch via ScrapingBee using native fetch()
 * Uses direct string interpolation (not URLSearchParams) to avoid encoding issues with API keys.
 */
async function fetchViaScrapingBee(targetUrl: string, render: boolean): Promise<string> {
  const key = process.env.SCRAPINGBEE_API_KEY || '';
  if (!key) throw new Error('No SCRAPINGBEE_API_KEY');
  const renderParam = render ? '&render_js=true' : '&render_js=false';
  const proxyUrl = `https://app.scrapingbee.com/api/v1/?api_key=${key}&url=${encodeURIComponent(targetUrl)}${renderParam}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`ScrapingBee ${res.status}`);
  return res.text();
}

/**
 * Race both providers in parallel — first successful response wins.
 */
async function fetchViaProxy(targetUrl: string, render = false): Promise<string> {
  const candidates: Promise<string>[] = [];
  if (process.env.SCRAPER_API_KEY) candidates.push(fetchViaScraperAPI(targetUrl, render));
  if (process.env.SCRAPINGBEE_API_KEY) candidates.push(fetchViaScrapingBee(targetUrl, render));

  if (candidates.length === 0) throw new Error('No scraping API keys configured');

  return Promise.any(candidates);
}

/**
 * Filter out listings that aren't actual watches
 */
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

// ===== Chrono24 scraper =====

interface C24Offer {
  name?: string;
  price?: string | number;
  url?: string;
  '@type'?: string;
}

interface C24GraphEntry {
  '@type'?: string;
  offers?: C24Offer | C24Offer[];
  itemListElement?: unknown[];
}

interface C24JsonLd {
  '@graph'?: C24GraphEntry[];
}

export async function scrapeChrono24(query: string, maxPrice = 50000): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://www.chrono24.com/search/index.htm?query=${encoded}&dosearch=true&usedWhere=us&priceTo=${maxPrice}&priceFrom=500`;
  // render=false: listing data is in inline scripts, not dynamically rendered.
  // This cuts response time from 20-30s to 2-5s and uses 1 credit instead of 10.
  const html = await fetchViaProxy(targetUrl, false);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  // Strategy 1: JSON-LD @graph parsing (legacy format)
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (jsonLdMatch) {
    try {
      const data: C24JsonLd = JSON.parse(jsonLdMatch[1]);
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
          const queryWords = query.toLowerCase().split(/\s+/);
          const titleLower = title.toLowerCase();
          const matchCount = queryWords.filter((w) => titleLower.includes(w)).length;
          if (matchCount < Math.min(2, queryWords.length)) continue;
          listings.push({ title, price, url, source: 'Chrono24', postedAgo: '' });
        }
      }
    } catch {
      // JSON-LD parse failed, fall through to Strategy 2
    }
  }

  // Strategy 2: regex extraction of "name"/"price"/"url" from embedded JSON
  // Works with current Chrono24 page structure where listing data is in inline scripts
  if (listings.length === 0) {
    const offerBlocks = [...html.matchAll(/"name":"([^"]+)"[\s\S]{0,300}?"price":"(\d+)"[\s\S]{0,300}?"url":"([^"]+)"/g)];
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

      const queryWords = query.toLowerCase().split(/\s+/);
      const titleLower = title.toLowerCase();
      const matchCount = queryWords.filter((w) => titleLower.includes(w)).length;
      if (matchCount < Math.min(2, queryWords.length)) continue;

      listings.push({ title, price, url, source: 'Chrono24', postedAgo: '' });
    }
  }

  return listings;
}

// ===== Watchfinder scraper =====

export async function scrapeWatchfinder(query: string, maxPrice = 50000): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  // Use .com with USD currency to ensure US-shippable results
  const targetUrl = `https://www.watchfinder.com/search?q=${encoded}&currency=USD`;
  const html = await fetchViaProxy(targetUrl, true);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  const cards = [...html.matchAll(/class="product-card[^"]*"[^>]*data-product-id="(\d+)"[^>]*href="([^"]+)"[\s\S]*?<\/a>/g)];

  for (const card of cards) {
    const productId = card[1];
    const path = card[2];
    const cardHtml = card[0];

    if (seen.has(productId)) continue;
    seen.add(productId);

    const titleMatch = cardHtml.match(/itemprop="name"[^>]*>([^<]+)/) ||
      cardHtml.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)/) ||
      cardHtml.match(/alt="([^"]+)"/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const priceMatch = cardHtml.match(/\$([\d,]+)/);
    if (!priceMatch) continue;
    const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);

    if (!title || isJunkListing(title)) continue;
    if (price < 500 || price > maxPrice) continue;

    const queryWords = query.toLowerCase().split(/\s+/);
    const titleLower = title.toLowerCase();
    const matchCount = queryWords.filter((w) => titleLower.includes(w)).length;
    if (matchCount < Math.min(2, queryWords.length)) continue;

    const url = path.startsWith('http') ? path : `https://www.watchfinder.com${path}`;

    listings.push({
      title,
      price,
      url,
      source: 'Watchfinder',
      postedAgo: '',
    });
  }

  return listings;
}

// ===== eBay scraper =====

export async function scrapeEbay(query: string, maxPrice = 50000): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  // Category 31387 = Wristwatches, LH_ItemCondition=3000 = Pre-owned, LH_PrefLoc=1 = US Only
  const targetUrl = `https://www.ebay.com/sch/31387/i.html?_nkw=${encoded}&_sop=12&LH_ItemCondition=3000&LH_PrefLoc=1&_udhi=${maxPrice}&_udlo=500`;
  // render=false: eBay search results are server-rendered HTML
  const html = await fetchViaProxy(targetUrl, false);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  // eBay search results use s-item containers
  const items = [...html.matchAll(/class="s-item\s[^"]*"[\s\S]*?<\/li>/g)];

  for (const item of items) {
    const block = item[0];

    // Extract title
    const titleMatch = block.match(/class="s-item__title"[^>]*>(?:<span[^>]*>)?([^<]+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();
    if (title === 'Shop on eBay' || title === 'Results matching fewer words') continue;

    // Extract price — look for s-item__price specifically
    const priceMatch = block.match(/class="s-item__price"[^>]*>\s*\$?([\d,]+(?:\.\d{2})?)/);
    if (!priceMatch) continue;
    const price = parseInt(priceMatch[1].replace(/[,\.]/g, '').slice(0, -2) || priceMatch[1].replace(/,/g, ''), 10);
    // Handle case where price might have decimals
    const rawPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    const finalPrice = Math.round(rawPrice);

    // Extract URL
    const urlMatch = block.match(/class="s-item__link"[^>]*href="([^"]+)"/);
    if (!urlMatch) continue;
    const url = urlMatch[1].split('?')[0]; // Clean tracking params

    // Deduplicate
    const itemId = url.match(/\/(\d+)(?:\?|$)/)?.[1] || url;
    if (seen.has(itemId)) continue;
    seen.add(itemId);

    if (isJunkListing(title)) continue;
    if (finalPrice < 500 || finalPrice > maxPrice) continue;

    // Relevance check
    const queryWords = query.toLowerCase().split(/\s+/);
    const titleLower = title.toLowerCase();
    const matchCount = queryWords.filter((w) => titleLower.includes(w)).length;
    if (matchCount < Math.min(2, queryWords.length)) continue;

    listings.push({
      title,
      price: finalPrice,
      url,
      source: 'eBay',
      postedAgo: '',
    });
  }

  return listings;
}

// ===== Jomashop scraper =====

export async function scrapeJomashop(query: string, maxPrice = 50000): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://www.jomashop.com/catalogsearch/result?q=${encoded}`;
  const html = await fetchViaProxy(targetUrl, true);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  // Jomashop uses product-item containers with structured data
  // Try JSON-LD first
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] !== 'Product') continue;
        const title = item.name?.trim();
        const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        if (!offer || !title) continue;

        const price = typeof offer.price === 'string' ? parseFloat(offer.price) : offer.price;
        const url = item.url || offer.url;
        if (!price || !url) continue;

        const finalPrice = Math.round(price);
        const key = url.replace(/[?#].*$/, '');
        if (seen.has(key)) continue;
        seen.add(key);

        if (isJunkListing(title)) continue;
        if (finalPrice < 500 || finalPrice > maxPrice) continue;

        const queryWords = query.toLowerCase().split(/\s+/);
        const titleLower = title.toLowerCase();
        const matchCount = queryWords.filter((w: string) => titleLower.includes(w)).length;
        if (matchCount < Math.min(2, queryWords.length)) continue;

        listings.push({
          title,
          price: finalPrice,
          url: url.startsWith('http') ? url : `https://www.jomashop.com${url}`,
          source: 'Jomashop',
          postedAgo: '',
        });
      }
    } catch {
      // Skip malformed JSON-LD
    }
  }

  // Fallback: regex-based parsing if JSON-LD didn't produce results
  if (listings.length === 0) {
    const productCards = [...html.matchAll(/<a[^>]*href="(\/[^"]*\.html)"[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?<\/a>/g)];
    for (const card of productCards) {
      const cardHtml = card[0];
      const path = card[1];

      const titleMatch = cardHtml.match(/class="[^"]*product-name[^"]*"[^>]*>([^<]+)/) ||
        cardHtml.match(/alt="([^"]+)"/);
      if (!titleMatch) continue;
      const title = titleMatch[1].trim();

      const priceMatch = cardHtml.match(/\$([\d,]+(?:\.\d{2})?)/);
      if (!priceMatch) continue;
      const price = Math.round(parseFloat(priceMatch[1].replace(/,/g, '')));

      const key = path;
      if (seen.has(key)) continue;
      seen.add(key);

      if (isJunkListing(title)) continue;
      if (price < 500 || price > maxPrice) continue;

      const queryWords = query.toLowerCase().split(/\s+/);
      const titleLower = title.toLowerCase();
      const matchCount = queryWords.filter((w) => titleLower.includes(w)).length;
      if (matchCount < Math.min(2, queryWords.length)) continue;

      listings.push({
        title,
        price,
        url: `https://www.jomashop.com${path}`,
        source: 'Jomashop',
        postedAgo: '',
      });
    }
  }

  return listings;
}

// ===== Combined scrapers =====

/**
 * Scrape all marketplaces in parallel: Chrono24 + eBay + Watchfinder + Jomashop.
 * All sources fire simultaneously to minimize wall time.
 */
export async function scrapeAllMarketplaces(query: string, maxPrice = 50000): Promise<ScrapedListing[]> {
  if (!process.env.SCRAPER_API_KEY && !process.env.SCRAPINGBEE_API_KEY) return [];

  // Fire Chrono24 + eBay in parallel — both use render=false so ~3s each
  const [c24, ebay] = await Promise.all([
    scrapeChrono24(query, maxPrice).catch(() => [] as ScrapedListing[]),
    scrapeEbay(query, maxPrice).catch(() => [] as ScrapedListing[]),
  ]);

  const allListings = [...c24, ...ebay];

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

/**
 * Generate marketplace search URLs for manual browsing
 */
export function getMarketplaceSearchUrls(query: string) {
  const encoded = encodeURIComponent(query);
  return {
    chrono24: `https://www.chrono24.com/search/index.htm?query=${encoded}&dosearch=true&usedWhere=us`,
    ebay: `https://www.ebay.com/sch/31387/i.html?_nkw=${encoded}&LH_ItemCondition=3000&LH_PrefLoc=1`,
    watchfinder: `https://www.watchfinder.com/search?q=${encoded}&currency=USD`,
    jomashop: `https://www.jomashop.com/catalogsearch/result?q=${encoded}`,
  };
}

/**
 * Calculate market stats from listings
 */
export function calculateMarketStats(listings: ScrapedListing[], minPrice = 500, maxPrice = 50000): {
  marketPrice: number | null;
  medianPrice: number | null;
  lowPrice: number | null;
  highPrice: number | null;
  sampleSize: number;
} {
  const validPrices = listings
    .filter((l) => l.price && l.price >= minPrice && l.price <= maxPrice)
    .map((l) => l.price as number)
    .sort((a, b) => a - b);

  if (validPrices.length === 0) {
    return { marketPrice: null, medianPrice: null, lowPrice: null, highPrice: null, sampleSize: 0 };
  }

  // Trim outliers (remove top/bottom 10%)
  const trimStart = Math.floor(validPrices.length * 0.1);
  const trimEnd = Math.ceil(validPrices.length * 0.9);
  const trimmed = validPrices.length >= 5
    ? validPrices.slice(trimStart, trimEnd)
    : validPrices;

  const median = trimmed[Math.floor(trimmed.length / 2)];
  const avg = Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);

  return {
    marketPrice: avg,
    medianPrice: median,
    lowPrice: validPrices[0],
    highPrice: validPrices[validPrices.length - 1],
    sampleSize: validPrices.length,
  };
}

/**
 * Full scrape: Chrono24 + Watchfinder for listings and market pricing
 */
export async function scrapeWatch(query: string, maxPrice = 50000): Promise<ScrapedMarketData> {
  const activeListings = await scrapeAllMarketplaces(query, maxPrice).catch(() => [] as ScrapedListing[]);

  // Market price from combined data
  const stats = calculateMarketStats(activeListings, 500, maxPrice);

  return {
    listings: activeListings,
    ...stats,
    scrapedAt: new Date().toISOString(),
  };
}
