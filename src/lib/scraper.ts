import * as https from 'https';
import * as cheerio from 'cheerio';

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

function fetchPage(urlStr: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
      },
    };
    https.get(options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http')
          ? res.headers.location
          : `https://${url.hostname}${res.headers.location}`;
        return fetchPage(loc).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (c: string) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('reddit')) {
      // Reddit URL: /r/Watchexchange/comments/xxx/wts_some_title/
      const parts = parsed.pathname.split('/');
      const titlePart = parts[5] || '';
      return titlePart
        .replace(/^(wts|wtb|wtt|fsot|fs)_/i, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
    }
    if (parsed.hostname.includes('watchuseek')) {
      // WatchUSeek: /threads/title-here.12345/
      const parts = parsed.pathname.split('/');
      const threadPart = parts[2] || '';
      return threadPart
        .replace(/\.\d+$/, '')
        .replace(/^(fs|fsot|wts)-/i, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
    }
  } catch {
    // fallback
  }
  return '';
}

function getSourceName(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('reddit')) return 'Reddit r/Watchexchange';
    if (parsed.hostname.includes('watchuseek')) return 'WatchUSeek';
    if (parsed.hostname.includes('omegaforums')) return 'OmegaForums';
    if (parsed.hostname.includes('chrono24')) return 'Chrono24';
    if (parsed.hostname.includes('ebay')) return 'eBay';
    return parsed.hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

/**
 * Scrape WatchRecon for real listings of a given watch query.
 * Returns listings with real prices and real direct links.
 */
export async function scrapeWatchRecon(query: string, days: number = 30): Promise<ScrapedListing[]> {
  const url = `https://www.watchrecon.com/?query=${encodeURIComponent(query)}&last=${days}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const listings: ScrapedListing[] = [];

  $('.galleryItemContainer').each((_i, el) => {
    const container = $(el);
    const link = container.find('.listingLink');
    const href = link.attr('href') || '';

    // Get title from the listing link text or URL
    const topLineText = container.find('.galleryItemContainerTopLine').text().trim();
    const urlTitle = extractTitleFromUrl(href);

    // Extract price from the listing text
    const allText = container.text();
    const priceMatch = allText.match(/\$[\d,]+/);
    const price = priceMatch ? parseInt(priceMatch[0].replace(/[$,]/g, '')) : null;

    // Extract "posted ago" time
    const detailText = container.find('.galleryItemContainerDetail').text().trim();
    const agoMatch = detailText.match(/(\d+\s+(?:min|hour|day|week|month)s?\s+ago)/i);
    const postedAgo = agoMatch ? agoMatch[1] : '';

    // Build a clean title
    let title = urlTitle || topLineText;
    // Remove price from title if it starts with it
    title = title.replace(/^\$[\d,]+\s*(\(.*?\))?\s*/g, '').trim();
    if (!title) title = topLineText.replace(/^\$[\d,]+\s*(\(.*?\))?\s*/g, '').trim();

    if (href && price && price >= 100) {
      listings.push({
        title: title || `Watch listing - $${price.toLocaleString()}`,
        price,
        url: href,
        source: getSourceName(href),
        postedAgo,
      });
    }
  });

  return listings;
}

/**
 * Generate real marketplace search URLs for a watch query
 */
export function getMarketplaceSearchUrls(query: string) {
  const encoded = encodeURIComponent(query);
  return {
    chrono24: `https://www.chrono24.com/search/index.htm?query=${encoded}&dosearch=true`,
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sacat=31387`,
    ebaySold: `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sacat=31387&LH_Complete=1&LH_Sold=1`,
    watchRecon: `https://www.watchrecon.com/?query=${encoded}`,
    reddit: `https://www.reddit.com/r/Watchexchange/search/?q=${encoded}&sort=new`,
  };
}

/**
 * Calculate market stats from a set of listings
 */
export function calculateMarketStats(listings: ScrapedListing[], minPrice = 100, maxPrice = 100000): {
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
  const trimmed = validPrices.slice(trimStart, trimEnd);

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
 * Full scrape: get listings + market stats for a watch query
 */
export async function scrapeWatch(query: string): Promise<ScrapedMarketData> {
  const listings = await scrapeWatchRecon(query, 30);
  const stats = calculateMarketStats(listings, 200, 50000);

  return {
    listings,
    ...stats,
    scrapedAt: new Date().toISOString(),
  };
}
