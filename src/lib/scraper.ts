import * as https from 'https';
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
 * Direct fetch (for sites that don't block, like eBay)
 */
function fetchPage(urlStr: string, maxRedirects = 3): Promise<string> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
      },
    };
    https.get(options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http')
          ? res.headers.location
          : `https://${url.hostname}${res.headers.location}`;
        return fetchPage(loc, maxRedirects - 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (c: string) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Fetch via ScraperAPI proxy (for sites that block direct access or need JS rendering)
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
    http.get(proxyUrl, { timeout: 45000 }, (res) => {
      let data = '';
      res.on('data', (c: string) => (data += c));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`ScraperAPI ${res.statusCode}`));
        }
        resolve(data);
      });
    }).on('error', reject);
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
    /go to previous slide/i,
    /shop on ebay/i,
  ];

  for (const pattern of junkPatterns) {
    if (pattern.test(lower)) return true;
  }

  return false;
}

// ===== eBay scrapers (direct, no proxy needed) =====

function parseEbayHtml(
  html: string,
  domain: string,
  source: string,
  query: string,
  currencySymbol: string,
  minPrice: number,
  maxPrice: number,
): ScrapedListing[] {
  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  const itemPattern = new RegExp(`https?://www\\.${domain.replace('.', '\\.')}/itm/(\\d+)`, 'g');
  const itemIdMatches = html.matchAll(itemPattern);
  const allIds: string[] = [];
  for (const m of itemIdMatches) {
    if (!allIds.includes(m[1])) allIds.push(m[1]);
  }

  for (const itemId of allIds) {
    if (seen.has(itemId)) continue;
    seen.add(itemId);

    const itemUrl = `https://www.${domain}/itm/${itemId}`;
    const pos = html.indexOf(itemUrl);
    if (pos === -1) continue;

    const context = html.substring(Math.max(0, pos - 3000), pos + 3000);

    const titleMatch = context.match(/(?:aria-label|title)="([^"]{15,150})"/);
    let title = titleMatch ? titleMatch[1] : '';
    title = title.replace(/^New Listing\s*/i, '').trim();

    if (!title || isJunkListing(title)) continue;
    if (/^(Shop on eBay|Go to|Results|See more)/.test(title)) continue;

    const escapedSymbol = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const priceRegex = new RegExp(`${escapedSymbol}([\\d.,]+)`, 'g');
    const priceMatches = [...context.matchAll(priceRegex)];
    if (priceMatches.length === 0) continue;

    let price: number | null = null;
    for (const pm of priceMatches) {
      let raw = pm[1];
      if (currencySymbol === 'EUR ' || currencySymbol === '£') {
        raw = raw.replace(/\./g, '').replace(',', '.');
      }
      const p = parseFloat(raw.replace(/,/g, ''));
      if (p >= minPrice && p <= maxPrice) {
        price = p;
        break;
      }
    }
    if (!price) continue;

    const queryWords = query.toLowerCase().split(/\s+/);
    const titleLower = title.toLowerCase();
    const matchCount = queryWords.filter((w) => titleLower.includes(w.toLowerCase())).length;
    if (matchCount < Math.min(2, queryWords.length)) continue;

    listings.push({ title, price, url: itemUrl, source, postedAgo: '' });
  }

  return listings;
}

export async function scrapeEbay(query: string): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_BIN=1&_udlo=500&_udhi=7000&_sop=12`;
  const html = await fetchPage(url);
  return parseEbayHtml(html, 'ebay.com', 'eBay', query, '$', 500, 7000);
}

export async function scrapeEbayUK(query: string): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://www.ebay.co.uk/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_BIN=1&_udlo=400&_udhi=5600&_sop=12`;
  const html = await fetchPage(url);
  const GBP_TO_USD = 1.27;
  const listings = parseEbayHtml(html, 'ebay.co.uk', 'eBay UK', query, '£', 400, 5600);
  return listings.map((l) => ({
    ...l,
    price: l.price ? Math.round(l.price * GBP_TO_USD) : null,
  }));
}

export async function scrapeEbaySold(query: string): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_Complete=1&LH_Sold=1&_udlo=500&_udhi=7000`;
  const html = await fetchPage(url);
  const listings = parseEbayHtml(html, 'ebay.com', 'eBay (Sold)', query, '$', 500, 7000);
  return listings.map((l) => ({ ...l, postedAgo: 'sold' }));
}

// ===== Chrono24 scraper (via ScraperAPI) =====

export async function scrapeChrono24(query: string): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://www.chrono24.com/search/index.htm?query=${encoded}&dosearch=true`;
  const html = await fetchViaProxy(targetUrl, true);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  // Chrono24 embeds structured JSON-LD Offer data
  const offerBlocks = [...html.matchAll(/"@type"\s*:\s*"Offer"[\s\S]*?"name"\s*:\s*"([^"]+)"[\s\S]*?"price"\s*:\s*"(\d+)"[\s\S]*?"url"\s*:\s*"([^"]+)"/g)];

  for (const match of offerBlocks) {
    const title = match[1].trim();
    const price = parseInt(match[2], 10);
    const url = match[3];

    const id = url.match(/--id(\d+)/)?.[1];
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);

    if (!title || isJunkListing(title)) continue;
    if (price < 500 || price > 7000) continue;

    // Validate title matches query
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

  return listings;
}

// ===== Watchfinder scraper (via ScraperAPI) =====

export async function scrapeWatchfinder(query: string): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://www.watchfinder.com/search?q=${encoded}`;
  const html = await fetchViaProxy(targetUrl, true);

  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  // Watchfinder uses product-card elements with data-product-id
  const cards = [...html.matchAll(/class="product-card[^"]*"[^>]*data-product-id="(\d+)"[^>]*href="([^"]+)"[\s\S]*?<\/a>/g)];

  for (const card of cards) {
    const productId = card[1];
    const path = card[2];
    const cardHtml = card[0];

    if (seen.has(productId)) continue;
    seen.add(productId);

    // Extract title from itemprop="name" or title-like elements
    const titleMatch = cardHtml.match(/itemprop="name"[^>]*>([^<]+)/) ||
      cardHtml.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)/) ||
      cardHtml.match(/alt="([^"]+)"/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract price
    const priceMatch = cardHtml.match(/\$([\d,]+)/);
    if (!priceMatch) continue;
    const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);

    if (!title || isJunkListing(title)) continue;
    if (price < 500 || price > 7000) continue;

    // Validate title matches query
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
 * Scrape all marketplaces for active listings.
 * eBay (direct) + Chrono24 & Watchfinder (via ScraperAPI)
 */
export async function scrapeAllMarketplaces(query: string): Promise<ScrapedListing[]> {
  const scrapers: Promise<ScrapedListing[]>[] = [
    scrapeEbay(query).catch(() => []),
    scrapeEbayUK(query).catch(() => []),
  ];

  // Only use proxy scrapers if API key is configured
  if (SCRAPER_API_KEY) {
    scrapers.push(
      scrapeChrono24(query).catch(() => []),
      scrapeWatchfinder(query).catch(() => []),
    );
  }

  const results = await Promise.all(scrapers);
  const all = results.flat();

  // Deduplicate by URL stem (item ID or path)
  const seen = new Set<string>();
  const combined: ScrapedListing[] = [];
  for (const listing of all) {
    const key = listing.url.replace(/[?#].*$/, '');
    if (seen.has(key)) continue;
    seen.add(key);
    combined.push(listing);
  }

  return combined;
}

// Keep backward-compatible alias
export const scrapeAllEbay = scrapeAllMarketplaces;

/**
 * Generate marketplace search URLs for manual browsing
 */
export function getMarketplaceSearchUrls(query: string) {
  const encoded = encodeURIComponent(query);
  return {
    chrono24: `https://www.chrono24.com/search/index.htm?query=${encoded}&dosearch=true`,
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_BIN=1`,
    ebayUK: `https://www.ebay.co.uk/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_BIN=1`,
    watchfinder: `https://www.watchfinder.com/search?q=${encoded}`,
    ebaySold: `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_Complete=1&LH_Sold=1`,
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
 * Full scrape: All marketplaces active + eBay sold for market pricing
 */
export async function scrapeWatch(query: string): Promise<ScrapedMarketData> {
  const [activeListings, soldListings] = await Promise.all([
    scrapeAllMarketplaces(query).catch(() => [] as ScrapedListing[]),
    scrapeEbaySold(query).catch(() => [] as ScrapedListing[]),
  ]);

  const forPricing = soldListings.length >= 3 ? soldListings : [...soldListings, ...activeListings];
  const stats = calculateMarketStats(forPricing, 500, 7000);

  return {
    listings: activeListings,
    ...stats,
    scrapedAt: new Date().toISOString(),
  };
}
