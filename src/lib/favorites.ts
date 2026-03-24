/**
 * Client-side watchlist/favorites using localStorage.
 */

const STORAGE_KEY = 'watch-favorites';

export interface FavoriteWatch {
  watchId: string;
  brand: string;
  model: string;
  addedAt: string;
  targetPrice?: number;
}

export function getFavorites(): FavoriteWatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addFavorite(watch: Omit<FavoriteWatch, 'addedAt'>): FavoriteWatch {
  const favorites = getFavorites();
  const existing = favorites.find(f => f.watchId === watch.watchId);
  if (existing) return existing;

  const entry: FavoriteWatch = { ...watch, addedAt: new Date().toISOString() };
  favorites.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return entry;
}

export function removeFavorite(watchId: string): void {
  const favorites = getFavorites().filter(f => f.watchId !== watchId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function isFavorite(watchId: string): boolean {
  return getFavorites().some(f => f.watchId === watchId);
}

export function setTargetPrice(watchId: string, price: number): void {
  const favorites = getFavorites();
  const fav = favorites.find(f => f.watchId === watchId);
  if (fav) {
    fav.targetPrice = price;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
}
