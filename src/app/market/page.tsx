'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatPrice, formatPct, trendColor } from '@/lib/utils';

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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [trendFilter, setTrendFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (brand) params.set('brand', brand);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    const res = await fetch(`/api/watches?${params}`);
    const data = await res.json();
    let filtered = data.watches || [];

    // Client-side trend filter
    if (trendFilter === 'up') {
      filtered = filtered.filter((w: Watch) => w.previousPrice && w.marketPrice > w.previousPrice);
    } else if (trendFilter === 'down') {
      filtered = filtered.filter((w: Watch) => w.previousPrice && w.marketPrice < w.previousPrice);
    }

    setWatches(filtered);
    setBrands(data.brands || []);
    setLoading(false);
  }, [search, brand, minPrice, maxPrice, trendFilter]);

  useEffect(() => {
    const timeout = setTimeout(loadData, 300);
    return () => clearTimeout(timeout);
  }, [loadData]);

  function pctChange(current: number, previous: number | null): string {
    if (!previous) return '—';
    const pct = ((current - previous) / previous) * 100;
    return formatPct(pct);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Market Prices</h1>
        <p className="text-sm text-gray-500">Live market values for {watches.length} watches</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand, model, reference..."
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
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
            <option value="up">↑ Rising</option>
            <option value="down">↓ Falling</option>
          </select>
          <select
            value={minPrice ? `${minPrice}-${maxPrice}` : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) { setMinPrice(''); setMaxPrice(''); return; }
              const [min, max] = val.split('-');
              setMinPrice(min);
              setMaxPrice(max || '');
            }}
            className="bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">Any Price</option>
            <option value="1000-5000">$1K – $5K</option>
            <option value="5000-10000">$5K – $10K</option>
            <option value="10000-25000">$10K – $25K</option>
            <option value="25000-50000">$25K – $50K</option>
            <option value="50000-">$50K+</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading market data...</div>
      ) : (
        <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Watch</th>
                  <th className="text-right px-4 py-3">Market Price</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">7d</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">30d</th>
                  <th className="text-right px-4 py-3 hidden lg:table-cell">90d</th>
                  <th className="text-center px-4 py-3 hidden lg:table-cell">Confidence</th>
                  <th className="text-center px-4 py-3 hidden md:table-cell">Listings</th>
                  <th className="text-right px-4 py-3 hidden lg:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {watches.map((w) => (
                  <tr key={w.id} className="deal-row">
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
                    <td className="text-right px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">
                      {new Date(w.lastUpdated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
