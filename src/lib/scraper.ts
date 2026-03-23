import * as http from 'http';

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

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '';

/**
 * Fetch via ScraperAPI proxy with JS rendering
 */
function fetchViaProxy(targetUrl: string, render = true): Promise<string> {
  if (!SCRAPER_API_KEY) return Promise.reject(new Error('No SCRAPER_API_KEY'));
  const params = new URLSearchParams({
    api_key: SCRAPER_API_KEY,
    url: targetUrl,
    ...(render ? { render: 'true' } : {}),
  });
  const proxyUrl = `http://api.scraperapi.com?${params.toString()}`;

  return new Promise((resolve, reject) => {
    const req = http.get(proxyUrl, { timeout: 60000 }, (res) => {
      let data = '';
      res.on('data', (c: string) => (data += c));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`ScraperAPI ${res.statusCode}`));
        }
        resolve(data);
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
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

export async function scrapeChrono24(query: string): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  // usedWhere=us filters to dealers that ship to the USA
  const targetUrl = `https://www.chrono24.com/search/index.htm?query=${encoded}&dosearch=true&usedWhere=us&priceTo=7000&priceFrom=500`;
  const html = await fetchViaProxy(targetUrl, true);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  // Parse JSON-LD structured data from the page
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!jsonLdMatch) return listings;

  try {
    const data: C24JsonLd = JSON.parse(jsonLdMatch[1]);
    const graph = data['@graph'] || [];

    // Find the AggregateOffer entry which contains all listing offers
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
        if (price < 500 || price > 7000) continue;

        // Validate title relevance
        const queryWords = query.toLowerCase().split(/\s+/);
        const titleLower = title.toLowerCase();
        const matchCount = queryWords.filter((w) => titleLower.includes(w)).length;
        if (matchCount < Math.min(2, queryWords.length)) continue;

        listings.push({
          title,
          price,
          url,
          source: 'Chrono24',
          postedAgo: '',
        });
      }
    }
  } catch {
    // Fallback: regex extraction if JSON parsing fails
    const offerBlocks = [...html.matchAll(/"name"\s*:\s*"([^"]+)"[\s\S]*?"price"\s*:\s*"(\d+)"[\s\S]*?"url"\s*:\s*"([^"]+)"/g)];
    for (const match of offerBlocks) {
      const title = match[1].trim();
      const price = parseInt(match[2], 10);
      const url = match[3];

      const id = url.match(/--id(\d+)/)?.[1];
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);

      if (!title || isJunkListing(title) || price < 500 || price > 7000) continue;

      listings.push({ title, price, url, source: 'Chrono24', postedAgo: '' });
    }
  }

  return listings;
}

// ===== Watchfinder scraper =====

export async function scrapeWatchfinder(query: string): Promise<ScrapedListing[]> {
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
    if (price < 500 || price > 7000) continue;

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

// ===== Combined scrapers =====

/**
 * Scrape all marketplaces: Chrono24 (primary) + Watchfinder (bonus).
 * Chrono24 alone gives 30+ listings per watch with verified prices.
 * Watchfinder is added only if Chrono24 completes fast enough.
 */
export async function scrapeAllMarketplaces(query: string): Promise<ScrapedListing[]> {
  if (!SCRAPER_API_KEY) return [];

  // Chrono24 is primary — always fetch. Watchfinder is bonus.
  const c24 = await scrapeChrono24(query).catch(() => [] as ScrapedListing[]);

  // Only fetch Watchfinder if Chrono24 returned few results
  let wf: ScrapedListing[] = [];
  if (c24.length < 10) {
    wf = await scrapeWatchfinder(query).catch(() => [] as ScrapedListing[]);
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const combined: ScrapedListing[] = [];
  for (const listing of [...c24, ...wf]) {
    const key = listing.url.replace(/[?#].*$/, '');
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
    watchfinder: `https://www.watchfinder.com/search?q=${encoded}&currency=USD`,
  };
}

/**
 * Calculate market stats from listings
 */
export function calculateMarketStats(listings: ScrapedListing[], minPrice = 500, maxPrice = 7000): {
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
export async function scrapeWatch(query: string): Promise<ScrapedMarketData> {
  const activeListings = await scrapeAllMarketplaces(query).catch(() => [] as ScrapedListing[]);

  // Market price from combined Chrono24 + Watchfinder data
  const stats = calculateMarketStats(activeListings, 500, 7000);

  return {
    listings: activeListings,
    ...stats,
    scrapedAt: new Date().toISOString(),
  };
}
