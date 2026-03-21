// In-memory store for serverless environments (Vercel)
// Data is generated on first access and cached in memory for the lifetime of the serverless function

import {
  WATCH_DATABASE,
  generateListings,
  generatePriceHistory,
  generateSoldRecords,
  type WatchReference,
} from './watch-data';

export interface Watch {
  id: string;
  brand: string;
  model: string;
  reference: string;
  imageUrl?: string;
  marketPrice: number;
  previousPrice: number | null;
  price7dAgo: number | null;
  price30dAgo: number | null;
  price90dAgo: number | null;
  confidence: number;
  lastUpdated: string;
  createdAt: string;
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

export interface PriceHistoryEntry {
  id: string;
  watchId: string;
  price: number;
  source: string;
  date: string;
}

export interface SoldRecordEntry {
  id: string;
  reference: string;
  price: number;
  source: string;
  soldDate: string;
  condition: string | null;
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

let _watches: Watch[] = [];
let _listings: Listing[] = [];
let _priceHistory: PriceHistoryEntry[] = [];
let _soldRecords: SoldRecordEntry[] = [];
let _alerts: AlertEntry[] = [];
let _settings: SettingsEntry = {
  refreshInterval: 60,
  minDiscountPct: 5,
  preferredBrands: '',
  alertEmail: '',
};
let _initialized = false;
let _idCounter = 0;

function genId(): string {
  _idCounter++;
  return `id_${Date.now()}_${_idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

function initStore() {
  if (_initialized) return;
  _initialized = true;

  for (const ref of WATCH_DATABASE) {
    const watchId = genId();
    const price7d = Math.round(ref.marketPrice * (0.97 + Math.random() * 0.06) / 100) * 100;
    const price30d = Math.round(ref.marketPrice * (0.94 + Math.random() * 0.12) / 100) * 100;
    const price90d = Math.round(ref.marketPrice * (0.90 + Math.random() * 0.20) / 100) * 100;

    _watches.push({
      id: watchId,
      brand: ref.brand,
      model: ref.model,
      reference: ref.reference,
      imageUrl: ref.imageUrl,
      marketPrice: ref.marketPrice,
      previousPrice: price7d,
      price7dAgo: price7d,
      price30dAgo: price30d,
      price90dAgo: price90d,
      confidence: Math.round((0.6 + Math.random() * 0.35) * 100) / 100,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Generate listings
    const listings = generateListings(ref, 2 + Math.floor(Math.random() * 4));
    for (const l of listings) {
      _listings.push({
        id: genId(),
        watchId,
        source: l.source,
        title: l.title,
        price: l.price,
        currency: 'USD',
        url: l.url,
        seller: l.seller || null,
        condition: l.condition || null,
        listedDate: l.listedDate.toISOString(),
        isActive: true,
      });
    }

    // Generate price history
    const history = generatePriceHistory(ref.marketPrice, 90);
    for (const h of history) {
      _priceHistory.push({
        id: genId(),
        watchId,
        price: h.price,
        source: h.source,
        date: h.date.toISOString(),
      });
    }

    // Generate sold records
    const sold = generateSoldRecords(ref.reference, ref.marketPrice);
    for (const s of sold) {
      _soldRecords.push({
        id: genId(),
        reference: s.reference,
        price: s.price,
        source: s.source,
        soldDate: s.soldDate.toISOString(),
        condition: s.condition || null,
      });
    }
  }
}

// ===== Public API =====

export function getWatches(opts?: {
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}): { watches: (Watch & { _count: { listings: number } })[]; brands: string[] } {
  initStore();

  let filtered = [..._watches];

  if (opts?.brand) filtered = filtered.filter((w) => w.brand === opts.brand);
  if (opts?.minPrice) filtered = filtered.filter((w) => w.marketPrice >= opts.minPrice!);
  if (opts?.maxPrice) filtered = filtered.filter((w) => w.marketPrice <= opts.maxPrice!);
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter(
      (w) =>
        w.brand.toLowerCase().includes(q) ||
        w.model.toLowerCase().includes(q) ||
        w.reference.toLowerCase().includes(q)
    );
  }

  // Only $1000+ min
  filtered = filtered.filter((w) => w.marketPrice >= 1000);
  filtered.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));

  const brands = [...new Set(_watches.map((w) => w.brand))].sort();

  return {
    watches: filtered.map((w) => ({
      ...w,
      _count: { listings: _listings.filter((l) => l.watchId === w.id && l.isActive).length },
    })),
    brands,
  };
}

export function getWatch(id: string) {
  initStore();
  const watch = _watches.find((w) => w.id === id);
  if (!watch) return null;

  const priceHistory = _priceHistory
    .filter((h) => h.watchId === id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const listings = _listings
    .filter((l) => l.watchId === id && l.isActive)
    .sort((a, b) => a.price - b.price);

  const soldRecords = _soldRecords
    .filter((s) => s.reference === watch.reference)
    .sort((a, b) => new Date(b.soldDate).getTime() - new Date(a.soldDate).getTime())
    .slice(0, 10);

  return { watch, priceHistory, listings, soldRecords };
}

export function getDeals(opts?: {
  brand?: string;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}) {
  initStore();

  const minDiscount = opts?.minDiscount || 0;
  const minPrice = opts?.minPrice || 1000;

  let deals = _listings
    .filter((l) => l.isActive)
    .map((l) => {
      const watch = _watches.find((w) => w.id === l.watchId);
      if (!watch || watch.marketPrice < 1000) return null;
      if (opts?.brand && watch.brand !== opts.brand) return null;

      const discount = ((watch.marketPrice - l.price) / watch.marketPrice) * 100;
      const savings = watch.marketPrice - l.price;

      return {
        id: l.id,
        watchId: watch.id,
        brand: watch.brand,
        model: watch.model,
        reference: watch.reference,
        listingPrice: l.price,
        marketPrice: watch.marketPrice,
        discount: Math.round(discount * 10) / 10,
        savings,
        source: l.source,
        url: l.url,
        seller: l.seller,
        condition: l.condition,
        listedDate: l.listedDate,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .filter((d) => d.discount >= minDiscount && d.listingPrice >= minPrice);

  if (opts?.maxPrice && opts.maxPrice > 0) {
    deals = deals.filter((d) => d.listingPrice <= opts.maxPrice!);
  }

  // Sort
  switch (opts?.sort) {
    case 'savings':
      deals.sort((a, b) => b.savings - a.savings);
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
      deals.sort((a, b) => new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime());
      break;
    default:
      deals.sort((a, b) => b.discount - a.discount);
  }

  const dealsAbove5 = deals.filter((d) => d.discount >= 5);
  const avgDiscount = dealsAbove5.length > 0
    ? Math.round((dealsAbove5.reduce((s, d) => s + d.discount, 0) / dealsAbove5.length) * 10) / 10
    : 0;

  return {
    deals,
    stats: {
      totalDeals: deals.length,
      dealsAbove5: dealsAbove5.length,
      dealsAbove10: deals.filter((d) => d.discount >= 10).length,
      dealsAbove15: deals.filter((d) => d.discount >= 15).length,
      avgDiscount,
      bestDeal: deals[0] || null,
    },
  };
}

export function searchWatches(q: string) {
  initStore();
  if (!q || q.length < 2) return [];

  const lower = q.toLowerCase();
  return _watches
    .filter(
      (w) =>
        w.brand.toLowerCase().includes(lower) ||
        w.model.toLowerCase().includes(lower) ||
        w.reference.toLowerCase().includes(lower)
    )
    .filter((w) => w.marketPrice >= 1000)
    .slice(0, 20);
}

export function refreshMarketData() {
  initStore();

  for (const watch of _watches) {
    const variation = 1 + (Math.random() - 0.5) * 0.04;
    const newPrice = Math.round(watch.marketPrice * variation / 100) * 100;
    watch.previousPrice = watch.marketPrice;
    watch.marketPrice = Math.max(newPrice, 1000);
    watch.lastUpdated = new Date().toISOString();

    _priceHistory.push({
      id: genId(),
      watchId: watch.id,
      price: newPrice,
      source: 'Market Refresh',
      date: new Date().toISOString(),
    });
  }

  return { success: true, message: `Refreshed ${_watches.length} watches`, timestamp: new Date().toISOString() };
}

export function getAlerts() {
  initStore();
  return _alerts.map((a) => ({
    ...a,
    watch: a.watchId ? _watches.find((w) => w.id === a.watchId) || null : null,
  }));
}

export function createAlert(data: {
  watchId?: string;
  brand?: string;
  modelName?: string;
  targetPrice?: number;
  discountPct?: number;
}) {
  initStore();
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

export function getSettings(): SettingsEntry {
  initStore();
  return { ..._settings };
}

export function updateSettings(data: Partial<SettingsEntry>) {
  initStore();
  if (data.refreshInterval !== undefined) _settings.refreshInterval = data.refreshInterval;
  if (data.minDiscountPct !== undefined) _settings.minDiscountPct = data.minDiscountPct;
  if (data.preferredBrands !== undefined) _settings.preferredBrands = data.preferredBrands;
  if (data.alertEmail !== undefined) _settings.alertEmail = data.alertEmail;
  return { ..._settings };
}
