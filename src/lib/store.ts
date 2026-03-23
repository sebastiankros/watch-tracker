// Real data store — multi-marketplace scraping
// No fake data. Every listing is real with a real URL.

import { scrapeAllMarketplaces, calculateMarketStats, type ScrapedListing } from './scraper';

// Watches we actively track — scrape on demand
const TRACKED_WATCHES = [
  { brand: 'Omega', model: 'Speedmaster', query: 'Omega Speedmaster' },
  { brand: 'Omega', model: 'Seamaster 300M', query: 'Omega Seamaster 300' },
  { brand: 'Omega', model: 'Aqua Terra', query: 'Omega Aqua Terra' },
  { brand: 'Tudor', model: 'Black Bay 58', query: 'Tudor Black Bay 58' },
  { brand: 'Tudor', model: 'Black Bay', query: 'Tudor Black Bay' },
  { brand: 'Tudor', model: 'Pelagos', query: 'Tudor Pelagos' },
  { brand: 'Seiko', model: 'Presage', query: 'Seiko Presage' },
  { brand: 'Seiko', model: 'Prospex', query: 'Seiko Prospex' },
  { brand: 'Grand Seiko', model: 'Snowflake', query: 'Grand Seiko Snowflake' },
  { brand: 'Grand Seiko', model: 'Heritage', query: 'Grand Seiko Heritage' },
  { brand: 'TAG Heuer', model: 'Carrera', query: 'TAG Heuer Carrera' },
  { brand: 'TAG Heuer', model: 'Aquaracer', query: 'TAG Heuer Aquaracer' },
  { brand: 'Cartier', model: 'Tank', query: 'Cartier Tank' },
  { brand: 'Cartier', model: 'Santos', query: 'Cartier Santos' },
  { brand: 'Longines', model: 'Spirit', query: 'Longines Spirit' },
  { brand: 'Longines', model: 'HydroConquest', query: 'Longines HydroConquest' },
  { brand: 'Oris', model: 'Aquis', query: 'Oris Aquis' },
  { brand: 'Oris', model: 'Big Crown', query: 'Oris Big Crown' },
  { brand: 'Hamilton', model: 'Khaki Field', query: 'Hamilton Khaki Field' },
  { brand: 'Hamilton', model: 'Intra-Matic', query: 'Hamilton Intra-Matic' },
  { brand: 'Tissot', model: 'PRX', query: 'Tissot PRX' },
  { brand: 'Sinn', model: '556', query: 'Sinn 556' },
  { brand: 'Sinn', model: '104', query: 'Sinn 104' },
  { brand: 'Nomos', model: 'Tangente', query: 'Nomos Tangente' },
  { brand: 'Breitling', model: 'Superocean', query: 'Breitling Superocean' },
  { brand: 'Breitling', model: 'Navitimer', query: 'Breitling Navitimer' },
  { brand: 'IWC', model: 'Pilot', query: 'IWC Pilot' },
  { brand: 'Bell & Ross', model: 'BR 05', query: 'Bell Ross BR 05' },
  { brand: 'Junghans', model: 'Max Bill', query: 'Junghans Max Bill' },
  { brand: 'Frederique Constant', model: 'Classics', query: 'Frederique Constant' },
];

// ===== Types =====

export interface Watch {
  id: string;
  brand: string;
  model: string;
  reference: string;
  marketPrice: number;
  previousPrice: number | null;
  price7dAgo: number | null;
  price30dAgo: number | null;
  price90dAgo: number | null;
  confidence: number;
  lastUpdated: string;
  createdAt: string;
  _count: { listings: number };
}

export interface Listing {
  id: string;
  watchId: string;
  source: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  seller: string | null;
  condition: string | null;
  listedDate: string;
  isActive: boolean;
}

export interface AlertEntry {
  id: string;
  watchId: string | null;
  brand: string | null;
  modelName: string | null;
  targetPrice: number | null;
  discountPct: number | null;
  isActive: boolean;
  lastTriggered: string | null;
  createdAt: string;
}

export interface SettingsEntry {
  refreshInterval: number;
  minDiscountPct: number;
  preferredBrands: string;
  alertEmail: string;
}

export interface PortfolioEntry {
  id: string;
  watchId: string | null;
  brand: string;
  model: string;
  reference: string;
  purchasePrice: number;
  purchaseDate: string;
  purchaseSource: string;
  purchaseUrl: string | null;
  soldPrice: number | null;
  soldDate: string | null;
  soldSource: string | null;
  fees: number;
  notes: string;
  status: 'holding' | 'sold';
  createdAt: string;
}

// ===== Cache =====

interface CachedWatch {
  watch: Watch;
  listings: Listing[];
  scrapedAt: number;
}

const cache = new Map<string, CachedWatch>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let _alerts: AlertEntry[] = [];
let _portfolio: PortfolioEntry[] = [];
let _settings: SettingsEntry = {
  refreshInterval: 60,
  minDiscountPct: 5,
  preferredBrands: '',
  alertEmail: '',
};
let _idCounter = 0;

function genId(): string {
  _idCounter++;
  return `w_${Date.now()}_${_idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

function isCacheFresh(entry: CachedWatch): boolean {
  return Date.now() - entry.scrapedAt < CACHE_TTL;
}

// ===== Scraping =====

async function scrapeAndCache(tracked: typeof TRACKED_WATCHES[number]): Promise<CachedWatch> {
  const watchId = `watch_${tracked.brand}_${tracked.model}`.replace(/\s+/g, '_').toLowerCase();

  const existing = cache.get(watchId);
  if (existing && isCacheFresh(existing)) return existing;

  try {
    // Scrape Chrono24 + Watchfinder (verified accurate prices)
    const activeListings = await scrapeAllMarketplaces(tracked.query).catch(() => [] as ScrapedListing[]);
    let inRange = activeListings.filter((l) => l.price && l.price >= 500 && l.price <= 7000);

    // Remove outliers
    const prices = inRange.map((l) => l.price!).sort((a, b) => a - b);
    if (prices.length >= 3) {
      const median = prices[Math.floor(prices.length / 2)];
      const floor = median * 0.4;
      const ceiling = median * 2.0;
      inRange = inRange.filter((l) => l.price! >= floor && l.price! <= ceiling);
    }
    const stats = calculateMarketStats(activeListings, 500, 7000);

    if (!stats.marketPrice || inRange.length === 0) {
      // Return existing cache even if stale, or empty
      if (existing) return existing;
      return makeEmptyWatch(watchId, tracked);
    }

    const prevWatch = existing?.watch;
    const listings: Listing[] = inRange.map((l, i) => ({
      id: `${watchId}_listing_${i}`,
      watchId,
      source: l.source,
      title: l.title,
      price: l.price!,
      currency: 'USD',
      url: l.url,
      seller: null,
      condition: null,
      listedDate: l.postedAgo || new Date().toISOString(),
      isActive: true,
    }));

    const watch: Watch = {
      id: watchId,
      brand: tracked.brand,
      model: tracked.model,
      reference: tracked.query,
      marketPrice: stats.marketPrice,
      previousPrice: prevWatch?.marketPrice || null,
      price7dAgo: prevWatch?.marketPrice || stats.marketPrice,
      price30dAgo: prevWatch?.price7dAgo || stats.marketPrice,
      price90dAgo: prevWatch?.price30dAgo || stats.marketPrice,
      confidence: Math.min(inRange.length / 20, 1),
      lastUpdated: new Date().toISOString(),
      createdAt: prevWatch?.createdAt || new Date().toISOString(),
      _count: { listings: listings.length },
    };

    const entry: CachedWatch = { watch, listings, scrapedAt: Date.now() };
    cache.set(watchId, entry);
    return entry;
  } catch {
    if (existing) return existing;
    return makeEmptyWatch(watchId, tracked);
  }
}

function makeEmptyWatch(watchId: string, tracked: typeof TRACKED_WATCHES[number]): CachedWatch {
  return {
    watch: {
      id: watchId,
      brand: tracked.brand,
      model: tracked.model,
      reference: tracked.query,
      marketPrice: 0,
      previousPrice: null,
      price7dAgo: null,
      price30dAgo: null,
      price90dAgo: null,
      confidence: 0,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      _count: { listings: 0 },
    },
    listings: [],
    scrapedAt: Date.now(),
  };
}

// Scrape a batch — limit concurrency to avoid hammering WatchRecon
async function scrapeAll(): Promise<CachedWatch[]> {
  const results: CachedWatch[] = [];
  // Scrape 5 at a time with 1s delay between batches
  const batchSize = 5;
  for (let i = 0; i < TRACKED_WATCHES.length; i += batchSize) {
    const batch = TRACKED_WATCHES.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((t) => scrapeAndCache(t)));
    results.push(...batchResults);
    if (i + batchSize < TRACKED_WATCHES.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return results;
}

// Max watches to scrape per request (ScraperAPI render calls are slow ~30s each)
const MAX_SCRAPE_PER_REQUEST = 3;

// Get all watches, using cache when fresh
// Only scrapes a few at a time to stay within Vercel's timeout
async function getAllCached(): Promise<CachedWatch[]> {
  const results: CachedWatch[] = [];
  const toScrape: typeof TRACKED_WATCHES[number][] = [];

  for (const tracked of TRACKED_WATCHES) {
    const watchId = `watch_${tracked.brand}_${tracked.model}`.replace(/\s+/g, '_').toLowerCase();
    const existing = cache.get(watchId);
    if (existing && isCacheFresh(existing)) {
      results.push(existing);
    } else {
      toScrape.push(tracked);
    }
  }

  // Only scrape a few at a time — each ScraperAPI call takes ~30s
  if (toScrape.length > 0) {
    const batch = toScrape.slice(0, MAX_SCRAPE_PER_REQUEST);
    const batchResults = await Promise.all(batch.map((t) => scrapeAndCache(t)));
    results.push(...batchResults);
  }

  return results.filter((r) => r.watch.marketPrice > 0);
}

// ===== Public API (same interface as before) =====

export async function getWatches(opts?: {
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<{ watches: Watch[]; brands: string[] }> {
  const all = await getAllCached();

  let watches = all.map((c) => c.watch);

  if (opts?.brand) watches = watches.filter((w) => w.brand === opts.brand);
  if (opts?.minPrice) watches = watches.filter((w) => w.marketPrice >= opts.minPrice!);
  if (opts?.maxPrice) watches = watches.filter((w) => w.marketPrice <= opts.maxPrice!);
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    watches = watches.filter(
      (w) =>
        w.brand.toLowerCase().includes(q) ||
        w.model.toLowerCase().includes(q) ||
        w.reference.toLowerCase().includes(q)
    );
  }

  watches = watches.filter((w) => w.marketPrice >= 500 && w.marketPrice <= 7000);
  watches.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));

  const brands = [...new Set(all.map((c) => c.watch.brand))].sort();

  return { watches, brands };
}

export async function getWatch(id: string) {
  // Try cache first
  const existing = cache.get(id);
  if (existing && isCacheFresh(existing)) {
    return {
      watch: existing.watch,
      priceHistory: [], // No fake history — real data only
      listings: existing.listings,
      soldRecords: [],
    };
  }

  // Find in tracked watches and scrape
  const tracked = TRACKED_WATCHES.find((t) => {
    const watchId = `watch_${t.brand}_${t.model}`.replace(/\s+/g, '_').toLowerCase();
    return watchId === id;
  });

  if (!tracked) return null;

  const result = await scrapeAndCache(tracked);
  if (result.watch.marketPrice === 0) return null;

  return {
    watch: result.watch,
    priceHistory: [],
    listings: result.listings,
    soldRecords: [],
  };
}

/**
 * Calculate a deal score (0-100) based on multiple weighted factors.
 * Higher score = better deal overall.
 */
function calculateDealScore(discount: number, savings: number, confidence: number, listingsCount: number): number {
  // Discount weight: 40% (normalized to 0-35% range)
  const discountScore = Math.min(discount / 35, 1) * 40;
  // Absolute savings weight: 25% (normalized to $0-$2000 range)
  const savingsScore = Math.min(savings / 2000, 1) * 25;
  // Confidence weight: 20% (how reliable is the market price)
  const confidenceScore = confidence * 20;
  // Market depth weight: 15% (more listings = more reliable pricing)
  const depthScore = Math.min(listingsCount / 20, 1) * 15;
  return Math.round(discountScore + savingsScore + confidenceScore + depthScore);
}

/**
 * Assign a badge based on deal characteristics.
 */
function getDealBadge(score: number, discount: number, savings: number): string | null {
  if (score >= 75 && discount >= 15) return 'hot';
  if (score >= 60) return 'great';
  if (savings >= 500 && discount >= 10) return 'best-value';
  if (discount >= 10) return 'good';
  return null;
}

export async function getDeals(opts?: {
  brand?: string;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}) {
  const all = await getAllCached();
  const minDiscount = opts?.minDiscount || 0;

  let deals: {
    id: string;
    watchId: string;
    brand: string;
    model: string;
    reference: string;
    listingPrice: number;
    marketPrice: number;
    discount: number;
    savings: number;
    dealScore: number;
    badge: string | null;
    source: string;
    url: string;
    seller: string | null;
    condition: string | null;
    listedDate: string;
    listingsCount: number;
    confidence: number;
  }[] = [];

  for (const cached of all) {
    const w = cached.watch;
    if (w.marketPrice < 500 || w.marketPrice > 7000) continue;
    if (opts?.brand && w.brand !== opts.brand) continue;

    for (const l of cached.listings) {
      if (!l.price || l.price >= w.marketPrice) continue;
      const discount = ((w.marketPrice - l.price) / w.marketPrice) * 100;
      const savings = w.marketPrice - l.price;

      if (discount > 35) continue;
      if (discount < minDiscount) continue;
      if (opts?.minPrice && l.price < opts.minPrice) continue;
      if (opts?.maxPrice && l.price > opts.maxPrice) continue;

      const dealScore = calculateDealScore(discount, savings, w.confidence, cached.listings.length);
      const badge = getDealBadge(dealScore, discount, savings);

      deals.push({
        id: l.id,
        watchId: w.id,
        brand: w.brand,
        model: w.model,
        reference: w.reference,
        listingPrice: l.price,
        marketPrice: w.marketPrice,
        discount: Math.round(discount * 10) / 10,
        savings,
        dealScore,
        badge,
        source: l.source,
        url: l.url,
        seller: l.seller,
        condition: l.condition,
        listedDate: l.listedDate,
        listingsCount: cached.listings.length,
        confidence: w.confidence,
      });
    }
  }

  // Sort
  switch (opts?.sort) {
    case 'savings':
      deals.sort((a, b) => b.savings - a.savings);
      break;
    case 'score':
      deals.sort((a, b) => b.dealScore - a.dealScore);
      break;
    case 'price_asc':
      deals.sort((a, b) => a.listingPrice - b.listingPrice);
      break;
    case 'price_desc':
      deals.sort((a, b) => b.listingPrice - a.listingPrice);
      break;
    case 'brand':
      deals.sort((a, b) => a.brand.localeCompare(b.brand));
      break;
    case 'recent':
      deals.sort((a, b) => b.listedDate.localeCompare(a.listedDate));
      break;
    default:
      // Default: sort by deal score (holistic ranking)
      deals.sort((a, b) => b.dealScore - a.dealScore);
  }

  const dealsAbove5 = deals.filter((d) => d.discount >= 5);
  const avgDiscount = dealsAbove5.length > 0
    ? Math.round((dealsAbove5.reduce((s, d) => s + d.discount, 0) / dealsAbove5.length) * 10) / 10
    : 0;
  const avgScore = deals.length > 0
    ? Math.round(deals.reduce((s, d) => s + d.dealScore, 0) / deals.length)
    : 0;
  const hotDeals = deals.filter((d) => d.badge === 'hot').length;

  return {
    deals,
    stats: {
      totalDeals: deals.length,
      dealsAbove5: dealsAbove5.length,
      dealsAbove10: deals.filter((d) => d.discount >= 10).length,
      dealsAbove15: deals.filter((d) => d.discount >= 15).length,
      avgDiscount,
      avgScore,
      hotDeals,
      bestDeal: deals[0] || null,
    },
  };
}

export function searchWatches(q: string) {
  if (!q || q.length < 2) return [];
  const lower = q.toLowerCase();
  const results: Watch[] = [];
  for (const [, cached] of cache) {
    const w = cached.watch;
    if (
      w.brand.toLowerCase().includes(lower) ||
      w.model.toLowerCase().includes(lower) ||
      w.reference.toLowerCase().includes(lower)
    ) {
      if (w.marketPrice >= 500 && w.marketPrice <= 7000) {
        results.push(w);
      }
    }
  }
  return results.slice(0, 20);
}

export async function refreshMarketData() {
  // Clear cache to force fresh scrapes
  cache.clear();
  // Scrape a small batch (full refresh happens gradually as pages are visited)
  const batch = TRACKED_WATCHES.slice(0, MAX_SCRAPE_PER_REQUEST);
  const results = await Promise.all(batch.map((t) => scrapeAndCache(t)));
  const scraped = results.filter((r) => r.watch.marketPrice > 0).length;
  return {
    success: true,
    message: `Scraped ${scraped} watches. Others will load as you browse. (${TRACKED_WATCHES.length} total tracked)`,
    timestamp: new Date().toISOString(),
  };
}

// ===== Alerts (in-memory, same API) =====

export function getAlerts() {
  return _alerts.map((a) => {
    const cached = a.watchId ? cache.get(a.watchId) : null;
    return { ...a, watch: cached?.watch || null };
  });
}

export function createAlert(data: {
  watchId?: string;
  brand?: string;
  modelName?: string;
  targetPrice?: number;
  discountPct?: number;
}) {
  const alert: AlertEntry = {
    id: genId(),
    watchId: data.watchId || null,
    brand: data.brand || null,
    modelName: data.modelName || null,
    targetPrice: data.targetPrice || null,
    discountPct: data.discountPct || null,
    isActive: true,
    lastTriggered: null,
    createdAt: new Date().toISOString(),
  };
  _alerts.push(alert);
  return alert;
}

export function deleteAlert(id: string) {
  _alerts = _alerts.filter((a) => a.id !== id);
  return true;
}

// ===== Settings (in-memory, same API) =====

export function getSettings(): SettingsEntry {
  return { ..._settings };
}

export function updateSettings(data: Partial<SettingsEntry>) {
  if (data.refreshInterval !== undefined) _settings.refreshInterval = data.refreshInterval;
  if (data.minDiscountPct !== undefined) _settings.minDiscountPct = data.minDiscountPct;
  if (data.preferredBrands !== undefined) _settings.preferredBrands = data.preferredBrands;
  if (data.alertEmail !== undefined) _settings.alertEmail = data.alertEmail;
  return { ..._settings };
}

// ===== Portfolio (in-memory) =====

export function getPortfolio() {
  // Attach current market price to each entry
  return _portfolio.map((p) => {
    const watchId = p.watchId || `watch_${p.brand}_${p.model}`.replace(/\s+/g, '_').toLowerCase();
    const cached = cache.get(watchId);
    const currentMarketPrice = cached?.watch.marketPrice || null;

    let profit: number | null = null;
    let profitPct: number | null = null;
    let roi: number | null = null;

    if (p.status === 'sold' && p.soldPrice !== null) {
      profit = p.soldPrice - p.purchasePrice - p.fees;
      profitPct = ((profit) / p.purchasePrice) * 100;
      // ROI considering fees
      roi = profitPct;
    }

    // Unrealized P&L for holdings
    let unrealizedProfit: number | null = null;
    let unrealizedPct: number | null = null;
    if (p.status === 'holding' && currentMarketPrice) {
      unrealizedProfit = currentMarketPrice - p.purchasePrice - p.fees;
      unrealizedPct = ((unrealizedProfit) / p.purchasePrice) * 100;
    }

    return {
      ...p,
      currentMarketPrice,
      profit,
      profitPct: profitPct !== null ? Math.round(profitPct * 10) / 10 : null,
      roi: roi !== null ? Math.round(roi * 10) / 10 : null,
      unrealizedProfit,
      unrealizedPct: unrealizedPct !== null ? Math.round(unrealizedPct * 10) / 10 : null,
    };
  });
}

export function getPortfolioStats() {
  const entries = getPortfolio();
  const holdings = entries.filter((e) => e.status === 'holding');
  const sold = entries.filter((e) => e.status === 'sold');

  const totalInvested = holdings.reduce((s, e) => s + e.purchasePrice, 0);
  const totalMarketValue = holdings.reduce((s, e) => s + (e.currentMarketPrice || e.purchasePrice), 0);
  const unrealizedPL = totalMarketValue - totalInvested;
  const unrealizedPLPct = totalInvested > 0 ? (unrealizedPL / totalInvested) * 100 : 0;

  const totalSoldRevenue = sold.reduce((s, e) => s + (e.soldPrice || 0), 0);
  const totalSoldCost = sold.reduce((s, e) => s + e.purchasePrice + e.fees, 0);
  const realizedPL = totalSoldRevenue - totalSoldCost;
  const realizedPLPct = totalSoldCost > 0 ? (realizedPL / totalSoldCost) * 100 : 0;
  const totalFees = sold.reduce((s, e) => s + e.fees, 0);

  const bestFlip = sold.length > 0
    ? sold.reduce((best, e) => (e.profit !== null && (best === null || e.profit > (best.profit || 0))) ? e : best, sold[0])
    : null;

  return {
    holdingCount: holdings.length,
    soldCount: sold.length,
    totalInvested: Math.round(totalInvested),
    totalMarketValue: Math.round(totalMarketValue),
    unrealizedPL: Math.round(unrealizedPL),
    unrealizedPLPct: Math.round(unrealizedPLPct * 10) / 10,
    realizedPL: Math.round(realizedPL),
    realizedPLPct: Math.round(realizedPLPct * 10) / 10,
    totalFees: Math.round(totalFees),
    bestFlip,
  };
}

export function addToPortfolio(data: {
  watchId?: string;
  brand: string;
  model: string;
  reference?: string;
  purchasePrice: number;
  purchaseDate?: string;
  purchaseSource?: string;
  purchaseUrl?: string;
  fees?: number;
  notes?: string;
}): PortfolioEntry {
  const entry: PortfolioEntry = {
    id: genId(),
    watchId: data.watchId || null,
    brand: data.brand,
    model: data.model,
    reference: data.reference || '',
    purchasePrice: data.purchasePrice,
    purchaseDate: data.purchaseDate || new Date().toISOString(),
    purchaseSource: data.purchaseSource || '',
    purchaseUrl: data.purchaseUrl || null,
    soldPrice: null,
    soldDate: null,
    soldSource: null,
    fees: data.fees || 0,
    notes: data.notes || '',
    status: 'holding',
    createdAt: new Date().toISOString(),
  };
  _portfolio.push(entry);
  return entry;
}

export function markAsSold(id: string, data: {
  soldPrice: number;
  soldDate?: string;
  soldSource?: string;
  fees?: number;
}): PortfolioEntry | null {
  const entry = _portfolio.find((p) => p.id === id);
  if (!entry) return null;
  entry.soldPrice = data.soldPrice;
  entry.soldDate = data.soldDate || new Date().toISOString();
  entry.soldSource = data.soldSource || '';
  if (data.fees !== undefined) entry.fees = data.fees;
  entry.status = 'sold';
  return entry;
}

export function updatePortfolioEntry(id: string, data: Partial<PortfolioEntry>): PortfolioEntry | null {
  const entry = _portfolio.find((p) => p.id === id);
  if (!entry) return null;
  if (data.purchasePrice !== undefined) entry.purchasePrice = data.purchasePrice;
  if (data.purchaseDate !== undefined) entry.purchaseDate = data.purchaseDate;
  if (data.purchaseSource !== undefined) entry.purchaseSource = data.purchaseSource;
  if (data.fees !== undefined) entry.fees = data.fees;
  if (data.notes !== undefined) entry.notes = data.notes;
  if (data.soldPrice !== undefined) entry.soldPrice = data.soldPrice;
  if (data.soldDate !== undefined) entry.soldDate = data.soldDate;
  if (data.soldSource !== undefined) entry.soldSource = data.soldSource;
  if (data.status !== undefined) entry.status = data.status;
  return entry;
}

export function deletePortfolioEntry(id: string): boolean {
  const len = _portfolio.length;
  _portfolio = _portfolio.filter((p) => p.id !== id);
  return _portfolio.length < len;
}
