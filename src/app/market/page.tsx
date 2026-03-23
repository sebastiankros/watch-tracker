'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatPrice, formatPct, trendColor } from '@/lib/utils';
import { SpinnerIcon, SearchIcon } from '@/components/Icons';
import Breadcrumbs from '@/components/Breadcrumbs';
import { SkeletonTable } from '@/components/Skeleton';

interface Watch {
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
  _count: { listings: number };
}

export default function MarketPage() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [trendFilter, setTrendFilter] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavOnly, setShowFavOnly] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('watchlist');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (brand) params.set('brand', brand);
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
    } else {
      params.set('minPrice', '500');
    }

    const res = await fetch(`/api/watches?${params}`);
    const data = await res.json();
    let filtered = data.watches || [];

    if (trendFilter === 'up') {
      filtered = filtered.filter((w: Watch) => w.previousPrice && w.marketPrice > w.previousPrice);
    } else if (trendFilter === 'down') {
      filtered = filtered.filter((w: Watch) => w.previousPrice && w.marketPrice < w.previousPrice);
    }

    if (showFavOnly) {
      filtered = filtered.filter((w: Watch) => favorites.includes(w.id));
    }

    setWatches(filtered);
    setBrands(data.brands || []);
    setLoading(false);
  }, [search, brand, priceRange, trendFilter, showFavOnly, favorites]);

  useEffect(() => {
    const timeout = setTimeout(loadData, 300);
    return () => clearTimeout(timeout);
  }, [loadData]);

  function pctChange(current: number, previous: number | null): string {
    if (!previous) return '\u2014';
    const pct = ((current - previous) / previous) * 100;
    return formatPct(pct);
  }

  function toggleFavorite(id: string) {
    const updated = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
    setFavorites(updated);
    try { localStorage.setItem('watchlist', JSON.stringify(updated)); } catch {}
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Market Prices' }]} />

      <div>
        <h1 className="text-2xl font-bold text-white">Market Prices</h1>
        <p className="text-sm text-gray-500">Live market values for tracked watches</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <SearchIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand, model, reference..."
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">All Brands</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            value={trendFilter}
            onChange={(e) => setTrendFilter(e.target.value)}
            className="bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">All Trends</option>
            <option value="up">Rising</option>
            <option value="down">Falling</option>
          </select>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">All Prices</option>
            <option value="500-2000">$500 - $2K</option>
            <option value="2000-5000">$2K - $5K</option>
            <option value="5000-10000">$5K - $10K</option>
            <option value="10000-25000">$10K - $25K</option>
            <option value="25000-50000">$25K - $50K</option>
          </select>
          <button
            onClick={() => setShowFavOnly(!showFavOnly)}
            className={`rounded-lg px-3 py-2 text-sm border transition ${
              showFavOnly
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                : 'bg-[#0a0a0f] border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            {showFavOnly ? '\u2605 Watchlist' : '\u2606 Watchlist'}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={10} cols={7} />
      ) : watches.length === 0 ? (
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-12 text-center">
          <SearchIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No watches match your filters</p>
        </div>
      ) : (
        <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-center px-2 py-3 w-8"></th>
                  <th className="text-left px-4 py-3">Watch</th>
                  <th className="text-right px-4 py-3">Market Price</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">7d</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">30d</th>
                  <th className="text-right px-4 py-3 hidden lg:table-cell">90d</th>
                  <th className="text-center px-4 py-3 hidden lg:table-cell">Confidence</th>
                  <th className="text-center px-4 py-3 hidden md:table-cell">Listings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {watches.map((w) => (
                  <tr key={w.id} className="deal-row">
                    <td className="text-center px-2 py-3">
                      <button
                        onClick={() => toggleFavorite(w.id)}
                        className={`text-sm transition ${favorites.includes(w.id) ? 'text-yellow-400' : 'text-gray-700 hover:text-yellow-400'}`}
                      >
                        {favorites.includes(w.id) ? '\u2605' : '\u2606'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/watches/${w.id}`} className="hover:text-blue-400">
                        <div className="text-white font-medium text-sm">{w.brand} {w.model}</div>
                        <div className="text-xs text-gray-500">Ref. {w.reference}</div>
                      </Link>
                    </td>
                    <td className="text-right px-4 py-3 text-white font-semibold">
                      {formatPrice(w.marketPrice)}
                    </td>
                    <td className={`text-right px-4 py-3 text-sm hidden md:table-cell ${trendColor(w.marketPrice, w.price7dAgo)}`}>
                      {pctChange(w.marketPrice, w.price7dAgo)}
                    </td>
                    <td className={`text-right px-4 py-3 text-sm hidden md:table-cell ${trendColor(w.marketPrice, w.price30dAgo)}`}>
                      {pctChange(w.marketPrice, w.price30dAgo)}
                    </td>
                    <td className={`text-right px-4 py-3 text-sm hidden lg:table-cell ${trendColor(w.marketPrice, w.price90dAgo)}`}>
                      {pctChange(w.marketPrice, w.price90dAgo)}
                    </td>
                    <td className="text-center px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(w.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(w.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="text-center px-4 py-3 text-sm text-gray-400 hidden md:table-cell">
                      {w._count.listings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
            Showing {watches.length} watches · Prices from Chrono24 + Watchfinder
          </div>
        </div>
      )}
    </div>
  );
}
