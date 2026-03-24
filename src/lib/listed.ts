// Client-side localStorage tracking of watches listed on user's marketplace.
// Each listed watch tracks its source URL so cron can verify availability.

export interface ListedWatch {
  id: string;
  dealId: string;
  watchId: string;
  brand: string;
  model: string;
  reference: string;
  sourceUrl: string;
  source: string;
  purchasePrice: number;
  listPrice: number; // price user listed on their marketplace
  marketPrice: number;
  dateListed: string;
  available: boolean; // whether the source listing is still live
  lastChecked: string | null;
}

const STORAGE_KEY = 'listed-watches';

function readStore(): ListedWatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStore(items: ListedWatch[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getListedWatches(): ListedWatch[] {
  return readStore();
}

export function addListedWatch(data: Omit<ListedWatch, 'id' | 'dateListed' | 'available' | 'lastChecked'>): ListedWatch {
  const items = readStore();
  const entry: ListedWatch = {
    ...data,
    id: `listed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    dateListed: new Date().toISOString(),
    available: true,
    lastChecked: null,
  };
  items.push(entry);
  writeStore(items);
  return entry;
}

export function removeListedWatch(id: string): void {
  const items = readStore().filter(w => w.id !== id);
  writeStore(items);
}

export function isListed(sourceUrl: string): boolean {
  return readStore().some(w => w.sourceUrl === sourceUrl);
}

export function updateAvailability(id: string, available: boolean): void {
  const items = readStore();
  const item = items.find(w => w.id === id);
  if (item) {
    item.available = available;
    item.lastChecked = new Date().toISOString();
    writeStore(items);
  }
}

export function updateListedWatches(updates: { id: string; available: boolean }[]): void {
  const items = readStore();
  for (const update of updates) {
    const item = items.find(w => w.id === update.id);
    if (item) {
      item.available = update.available;
      item.lastChecked = new Date().toISOString();
    }
  }
  writeStore(items);
}
