import * as https from 'https';

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

/**
 * Parse eBay search results HTML into listings.
 * Works for ebay.com, ebay.co.uk, ebay.de etc.
 */
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

    // Extract price using currency symbol
    const escapedSymbol = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const priceRegex = new RegExp(`${escapedSymbol}([\\d.,]+)`, 'g');
    const priceMatches = [...context.matchAll(priceRegex)];
    if (priceMatches.length === 0) continue;

    let price: number | null = null;
    for (const pm of priceMatches) {
      // Handle both US (1,234.56) and EU (1.234,56) number formats
      let raw = pm[1];
      if (currencySymbol === 'EUR ' || currencySymbol === '£') {
        // EU format: 1.234,56 → 1234.56
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

/**
 * Scrape eBay US Buy It Now listings.
 */
export async function scrapeEbay(query: string): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_BIN=1&_udlo=500&_udhi=7000&_sop=12`;
  const html = await fetchPage(url);
  return parseEbayHtml(html, 'ebay.com', 'eBay', query, '$', 500, 7000);
}

/**
 * Scrape eBay UK Buy It Now listings (prices in GBP, converted to USD).
 */
export async function scrapeEbayUK(query: string): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://www.ebay.co.uk/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_BIN=1&_udlo=400&_udhi=5600&_sop=12`;
  const html = await fetchPage(url);
  const GBP_TO_USD = 1.27;
  const listings = parseEbayHtml(html, 'ebay.co.uk', 'eBay UK', query, '£', 400, 5600);
  // Convert GBP to USD
  return listings.map((l) => ({
    ...l,
    price: l.price ? Math.round(l.price * GBP_TO_USD) : null,
  }));
}


/**
 * Scrape eBay sold/completed listings for market value calculation
 */
export async function scrapeEbaySold(query: string): Promise<ScrapedListing[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_Complete=1&LH_Sold=1&_udlo=500&_udhi=7000`;
  const html = await fetchPage(url);
  const listings = parseEbayHtml(html, 'ebay.com', 'eBay (Sold)', query, '$', 500, 7000);
  return listings.map((l) => ({ ...l, postedAgo: 'sold' }));
}

/**
 * Scrape all eBay marketplaces (US + UK + DE) for maximum coverage.
 * Returns combined, deduplicated listings from all three.
 */
export async function scrapeAllEbay(query: string): Promise<ScrapedListing[]> {
  const [us, uk] = await Promise.all([
    scrapeEbay(query).catch(() => [] as ScrapedListing[]),
    scrapeEbayUK(query).catch(() => [] as ScrapedListing[]),
  ]);

  // Deduplicate by item ID (same item can appear on multiple eBay domains)
  const seen = new Set<string>();
  const combined: ScrapedListing[] = [];
  for (const listing of [...us, ...uk]) {
    const itemId = listing.url.match(/itm\/(\d+)/)?.[1];
    if (itemId && seen.has(itemId)) continue;
    if (itemId) seen.add(itemId);
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
    chrono24: `https://www.chrono24.com/search/index.htm?query=${encoded}&dosearch=true`,
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_BIN=1`,
    ebayUK: `https://www.ebay.co.uk/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_BIN=1`,
    ebaySold: `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_Complete=1&LH_Sold=1`,
    jomashop: `https://www.jomashop.com/search?q=${encoded}`,
    watchbox: `https://www.thewatchbox.com/shop/?q=${encoded}`,
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
 * Full scrape: All eBay marketplaces (US+UK+DE) active + US sold data for market price
 */
export async function scrapeWatch(query: string): Promise<ScrapedMarketData> {
  // Scrape all eBay marketplaces for active listings + US sold for pricing
  const [activeListings, soldListings] = await Promise.all([
    scrapeAllEbay(query).catch(() => [] as ScrapedListing[]),
    scrapeEbaySold(query).catch(() => [] as ScrapedListing[]),
  ]);

  // Market price based on sold data (more accurate) falling back to active listings
  const forPricing = soldListings.length >= 3 ? soldListings : [...soldListings, ...activeListings];
  const stats = calculateMarketStats(forPricing, 500, 7000);

  return {
    listings: activeListings,
    ...stats,
    scrapedAt: new Date().toISOString(),
  };
}
