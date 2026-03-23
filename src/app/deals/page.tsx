'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatPrice, discountColor, discountBg, timeAgo, badgeLabel, badgeStyle, formatDealForSharing } from '@/lib/utils';
import { ExternalLinkIcon, CopyIcon, SearchIcon, SpinnerIcon } from '@/components/Icons';
import Breadcrumbs from '@/components/Breadcrumbs';
import ScoreRing from '@/components/ScoreRing';
import PriceBar from '@/components/PriceBar';
import { SkeletonTable } from '@/components/Skeleton';

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
  dealScore: number;
  badge: string | null;
  source: string;
  url: string;
  seller: string | null;
  condition: string | null;
  listedDate: string;
  listingsCount: number;
  confidence: number;
}

interface DealStats {
  totalDeals: number;
  dealsAbove5: number;
  dealsAbove10: number;
  dealsAbove15: number;
  avgDiscount: number;
  avgScore: number;
  hotDeals: number;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [brand, setBrand] = useState('');
  const [minDiscount, setMinDiscount] = useState('3');
  const [minPrice, setMinPrice] = useState('500');
  const [maxPrice, setMaxPrice] = useState('50000');
  const [sort, setSort] = useState('score');

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

  function shareDeal(deal: Deal) {
    const text = formatDealForSharing(deal);
    navigator.clipboard.writeText(text);
    setCopiedId(deal.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Deals' }]} />

      <div>
        <h1 className="text-2xl font-bold text-white">Deals</h1>
        <p className="text-sm text-gray-500">Watches listed below market value · Ranked by Deal Score</p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <MiniStat label="Total Deals" value={stats.totalDeals} />
          <MiniStat label="Hot Deals" value={stats.hotDeals} color="text-red-400" />
          <MiniStat label=">5% Under" value={stats.dealsAbove5} color="text-orange-400" />
          <MiniStat label=">10% Under" value={stats.dealsAbove10} color="text-yellow-400" />
          <MiniStat label="Avg Discount" value={`${stats.avgDiscount}%`} color="text-green-400" />
          <MiniStat label="Avg Score" value={stats.avgScore} color="text-blue-400" />
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
              <option value="3">3%+</option>
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
              <option value="2000">Up to $2,000</option>
              <option value="5000">Up to $5,000</option>
              <option value="10000">Up to $10,000</option>
              <option value="25000">Up to $25,000</option>
              <option value="50000">Up to $50,000</option>
              <option value="100000">No limit</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="score">Best Deal Score</option>
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

      {/* Deals */}
      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : deals.length === 0 ? (
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-12 text-center">
          <SearchIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No deals match your filters</p>
          <p className="text-sm text-gray-600 mt-1">Try lowering the minimum discount or expanding the price range</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-center px-3 py-3 w-12">Score</th>
                    <th className="text-left px-4 py-3">Watch</th>
                    <th className="text-right px-4 py-3">Price</th>
                    <th className="text-left px-4 py-3 w-40">vs Market</th>
                    <th className="text-right px-4 py-3">Discount</th>
                    <th className="text-right px-4 py-3">Savings</th>
                    <th className="text-left px-4 py-3">Source</th>
                    <th className="text-center px-3 py-3 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {deals.map((deal) => (
                    <tr key={deal.id} className={`deal-row ${deal.badge === 'hot' ? 'deal-hot' : ''}`}>
                      <td className="px-3 py-3 text-center">
                        <ScoreRing score={deal.dealScore} size={32} />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/watches/${deal.watchId}`} className="hover:text-blue-400 transition">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{deal.brand} {deal.model}</span>
                            {deal.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle(deal.badge)}`}>
                                {badgeLabel(deal.badge)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Ref. {deal.reference}</div>
                        </Link>
                      </td>
                      <td className="text-right px-4 py-3 text-white font-semibold text-sm">
                        {formatPrice(deal.listingPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <PriceBar listingPrice={deal.listingPrice} marketPrice={deal.marketPrice} />
                        <div className="text-[10px] text-gray-500 mt-1">Market: {formatPrice(deal.marketPrice)}</div>
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
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={deal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Open listing"
                          >
                            <ExternalLinkIcon className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => shareDeal(deal)}
                            className="text-gray-500 hover:text-white p-1"
                            title="Copy deal info"
                          >
                            {copiedId === deal.id ? (
                              <span className="text-green-400 text-[10px] font-bold">Copied</span>
                            ) : (
                              <CopyIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className={`bg-[#111118] border border-gray-800 rounded-xl p-4 space-y-3 ${deal.badge === 'hot' ? 'deal-hot' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <ScoreRing score={deal.dealScore} size={40} />
                    <div>
                      <Link href={`/watches/${deal.watchId}`} className="hover:text-blue-400">
                        <div className="text-white font-medium text-sm">{deal.brand} {deal.model}</div>
                      </Link>
                      <div className="text-xs text-gray-500">{deal.source}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {deal.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle(deal.badge)}`}>
                        {badgeLabel(deal.badge)}
                      </span>
                    )}
                    <span className={`inline-block px-2 py-0.5 rounded-md text-sm font-bold border ${discountBg(deal.discount)} ${discountColor(deal.discount)}`}>
                      -{deal.discount}%
                    </span>
                  </div>
                </div>

                <PriceBar listingPrice={deal.listingPrice} marketPrice={deal.marketPrice} />

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-white font-semibold">{formatPrice(deal.listingPrice)}</span>
                    <span className="text-gray-600 mx-1">vs</span>
                    <span className="text-gray-400">{formatPrice(deal.marketPrice)}</span>
                  </div>
                  <span className="text-green-400 font-medium">Save {formatPrice(deal.savings)}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-800/50">
                  <button onClick={() => shareDeal(deal)} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                    <CopyIcon className="w-3 h-3" />
                    {copiedId === deal.id ? 'Copied!' : 'Share'}
                  </button>
                  <a href={deal.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-medium text-sm inline-flex items-center gap-1">
                    View <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="text-center text-xs text-gray-600">
        Showing {deals.length} deals · Ranked by Deal Score (discount, savings, confidence, market depth)
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
