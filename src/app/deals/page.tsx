'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatPrice, discountColor, discountBg, timeAgo } from '@/lib/utils';
import { ExternalLinkIcon, CopyIcon, SearchIcon, SpinnerIcon } from '@/components/Icons';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Deal {
  id: string;
  watchId: string;
  brand: string;
  model: string;
  reference: string;
  listingPrice: number;
  marketPrice: number;
  discount: number;
  savings: number;
  source: string;
  url: string;
  seller: string | null;
  condition: string | null;
  listedDate: string;
}

interface DealStats {
  totalDeals: number;
  dealsAbove5: number;
  dealsAbove10: number;
  dealsAbove15: number;
  avgDiscount: number;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [brand, setBrand] = useState('');
  const [minDiscount, setMinDiscount] = useState('5');
  const [minPrice, setMinPrice] = useState('500');
  const [maxPrice, setMaxPrice] = useState('7000');
  const [sort, setSort] = useState('discount');

  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (brand) params.set('brand', brand);
      params.set('minDiscount', minDiscount);
      params.set('minPrice', minPrice);
      params.set('maxPrice', maxPrice);
      params.set('sort', sort);

      const res = await fetch(`/api/deals?${params}`);
      const data = await res.json();
      setDeals(data.deals || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [brand, minDiscount, minPrice, maxPrice, sort]);

  useEffect(() => {
    fetch('/api/watches').then(r => r.json()).then(d => setBrands(d.brands || []));
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Deals' }]} />

      <div>
        <h1 className="text-2xl font-bold text-white">Deals</h1>
        <p className="text-sm text-gray-500">Watches listed below market value &middot; $500 &ndash; $7,000</p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MiniStat label="Total Deals" value={stats.totalDeals} />
          <MiniStat label=">5% Under" value={stats.dealsAbove5} color="text-orange-400" />
          <MiniStat label=">10% Under" value={stats.dealsAbove10} color="text-yellow-400" />
          <MiniStat label=">15% Under" value={stats.dealsAbove15} color="text-green-400" />
          <MiniStat label="Avg Discount" value={`${stats.avgDiscount}%`} color="text-blue-400" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Brand</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Min Discount %</label>
            <select
              value={minDiscount}
              onChange={(e) => setMinDiscount(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="0">Any</option>
              <option value="5">5%+</option>
              <option value="10">10%+</option>
              <option value="15">15%+</option>
              <option value="20">20%+</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Min Price</label>
            <select
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="500">$500</option>
              <option value="1000">$1,000</option>
              <option value="2000">$2,000</option>
              <option value="3000">$3,000</option>
              <option value="5000">$5,000</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Max Price</label>
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="1000">Up to $1,000</option>
              <option value="2000">Up to $2,000</option>
              <option value="3000">Up to $3,000</option>
              <option value="5000">Up to $5,000</option>
              <option value="7000">Up to $7,000</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="discount">Highest Discount %</option>
              <option value="savings">Highest Savings $</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="brand">Brand A-Z</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deals Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
          <SpinnerIcon className="w-5 h-5" /> Loading deals...
        </div>
      ) : deals.length === 0 ? (
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-12 text-center">
          <SearchIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No deals match your filters</p>
          <p className="text-sm text-gray-600 mt-1">Try lowering the minimum discount or expanding the price range</p>
        </div>
      ) : (
        <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Watch</th>
                  <th className="text-right px-4 py-3">Listing Price</th>
                  <th className="text-right px-4 py-3">Market Price</th>
                  <th className="text-right px-4 py-3">Discount</th>
                  <th className="text-right px-4 py-3">Savings</th>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3">Condition</th>
                  <th className="text-left px-4 py-3">Listed</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {deals.map((deal) => (
                  <tr key={deal.id} className="deal-row">
                    <td className="px-4 py-3">
                      <Link href={`/watches/${deal.watchId}`} className="hover:text-blue-400 transition">
                        <div className="text-white font-medium text-sm">{deal.brand} {deal.model}</div>
                        <div className="text-xs text-gray-500">Ref. {deal.reference}</div>
                      </Link>
                    </td>
                    <td className="text-right px-4 py-3 text-white font-semibold text-sm">
                      {formatPrice(deal.listingPrice)}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-400 text-sm">
                      {formatPrice(deal.marketPrice)}
                    </td>
                    <td className="text-right px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-sm font-bold border ${discountBg(deal.discount)} ${discountColor(deal.discount)}`}>
                        -{deal.discount}%
                      </span>
                    </td>
                    <td className="text-right px-4 py-3 text-green-400 text-sm font-medium">
                      {formatPrice(deal.savings)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-300">{deal.source}</div>
                      {deal.seller && <div className="text-xs text-gray-600">{deal.seller}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{deal.condition || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{timeAgo(deal.listedDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={deal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 text-sm font-medium"
                        >
                          View <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => copyUrl(deal.url)}
                          className="text-gray-500 hover:text-white"
                          title="Copy link"
                        >
                          <CopyIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-800/50">
            {deals.map((deal) => (
              <div key={deal.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <Link href={`/watches/${deal.watchId}`} className="hover:text-blue-400">
                    <div className="text-white font-medium text-sm">{deal.brand} {deal.model}</div>
                    <div className="text-xs text-gray-500">Ref. {deal.reference}</div>
                  </Link>
                  <span className={`inline-block px-2 py-0.5 rounded-md text-sm font-bold border ${discountBg(deal.discount)} ${discountColor(deal.discount)}`}>
                    -{deal.discount}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-white font-semibold">{formatPrice(deal.listingPrice)}</span>
                    <span className="text-gray-600 mx-1">vs</span>
                    <span className="text-gray-400">{formatPrice(deal.marketPrice)}</span>
                  </div>
                  <span className="text-green-400 font-medium">Save {formatPrice(deal.savings)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{deal.source} &middot; {deal.condition || 'N/A'} &middot; {timeAgo(deal.listedDate)}</span>
                  <a href={deal.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-medium inline-flex items-center gap-1">
                    View <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-600">
        Showing {deals.length} deals &middot; Prices updated periodically from multiple sources
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-[#111118] border border-gray-800 rounded-lg px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xl font-bold ${color || 'text-white'}`}>{value}</div>
    </div>
  );
}
