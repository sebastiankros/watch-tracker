// Client-side portfolio persistence via localStorage
// Data lives in the browser — survives Vercel cold starts

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

export interface EnrichedEntry extends PortfolioEntry {
  currentMarketPrice: number | null;
  profit: number | null;
  profitPct: number | null;
  unrealizedProfit: number | null;
  unrealizedPct: number | null;
}

const STORAGE_KEY = 'portfolio';

function genId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function load(): PortfolioEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(entries: PortfolioEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function getPortfolioEntries(): PortfolioEntry[] {
  return load();
}

export function addEntry(data: {
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
  const entries = load();
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
  entries.push(entry);
  save(entries);
  return entry;
}

export function markSold(id: string, data: {
  soldPrice: number;
  soldDate?: string;
  soldSource?: string;
  fees?: number;
}): PortfolioEntry | null {
  const entries = load();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return null;
  entry.soldPrice = data.soldPrice;
  entry.soldDate = data.soldDate || new Date().toISOString();
  entry.soldSource = data.soldSource || '';
  if (data.fees !== undefined) entry.fees = data.fees;
  entry.status = 'sold';
  save(entries);
  return entry;
}

export function deleteEntry(id: string): boolean {
  const entries = load();
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) return false;
  save(filtered);
  return true;
}

export function enrichWithMarketPrices(
  entries: PortfolioEntry[],
  marketPrices: Map<string, number>
): EnrichedEntry[] {
  return entries.map((p) => {
    const watchId = p.watchId || `watch_${p.brand}_${p.model}`.replace(/\s+/g, '_').toLowerCase();
    const currentMarketPrice = marketPrices.get(watchId) || null;

    let profit: number | null = null;
    let profitPct: number | null = null;

    if (p.status === 'sold' && p.soldPrice !== null) {
      profit = p.soldPrice - p.purchasePrice - p.fees;
      profitPct = Math.round(((profit) / p.purchasePrice) * 1000) / 10;
    }

    let unrealizedProfit: number | null = null;
    let unrealizedPct: number | null = null;
    if (p.status === 'holding' && currentMarketPrice) {
      unrealizedProfit = currentMarketPrice - p.purchasePrice - p.fees;
      unrealizedPct = Math.round(((unrealizedProfit) / p.purchasePrice) * 1000) / 10;
    }

    return {
      ...p,
      currentMarketPrice,
      profit,
      profitPct,
      unrealizedProfit,
      unrealizedPct,
    };
  });
}

export function calculateStats(entries: EnrichedEntry[]) {
  const holdings = entries.filter((e) => e.status === 'holding');
  const sold = entries.filter((e) => e.status === 'sold');

  const totalInvested = holdings.reduce((s, e) => s + e.purchasePrice, 0);
  const totalMarketValue = holdings.reduce((s, e) => s + (e.currentMarketPrice || e.purchasePrice), 0);
  const unrealizedPL = totalMarketValue - totalInvested;
  const unrealizedPLPct = totalInvested > 0 ? Math.round((unrealizedPL / totalInvested) * 1000) / 10 : 0;

  const totalSoldRevenue = sold.reduce((s, e) => s + (e.soldPrice || 0), 0);
  const totalSoldCost = sold.reduce((s, e) => s + e.purchasePrice + e.fees, 0);
  const realizedPL = totalSoldRevenue - totalSoldCost;
  const realizedPLPct = totalSoldCost > 0 ? Math.round((realizedPL / totalSoldCost) * 1000) / 10 : 0;
  const totalFees = entries.reduce((s, e) => s + e.fees, 0);

  return {
    holdingCount: holdings.length,
    soldCount: sold.length,
    totalInvested: Math.round(totalInvested),
    totalMarketValue: Math.round(totalMarketValue),
    unrealizedPL: Math.round(unrealizedPL),
    unrealizedPLPct,
    realizedPL: Math.round(realizedPL),
    realizedPLPct,
    totalFees: Math.round(totalFees),
  };
}
