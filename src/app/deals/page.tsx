'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { formatPrice, discountColor, discountBg, badgeLabel, badgeStyle, formatDealForSharing } from '@/lib/utils';
import { cachedFetch } from '@/lib/api-cache';
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

interface DealGroup {
  watchId: string;
  brand: string;
  model: string;
  reference: string;
  marketPrice: number;
  best: Deal;
  others: Deal[];
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [brand, setBrand] = useState('');
  const [minDiscount, setMinDiscount] = useState('3');
  const [minPrice, setMinPrice] = useState('500');
  const [maxPrice, setMaxPrice] = useState('50000');
  const [sort, setSort] = useState('score');
  const [condition, setCondition] = useState('');

  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (brand) params.set('brand', brand);
      if (condition) params.set('condition', condition);
      params.set('minDiscount', minDiscount);
      params.set('minPrice', minPrice);
      params.set('maxPrice', maxPrice);
      params.set('sort', sort);

      const data = await cachedFetch<{ deals: Deal[]; stats: DealStats }>(`/api/deals?${params}`);
      setDeals(data.deals || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [brand, minDiscount, minPrice, maxPrice, sort, condition]);

  useEffect(() => {
    cachedFetch<{ brands: string[] }>('/api/watches').then(d => setBrands(d.brands || []));
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Group deals by watchId, best deal first
  const groups: DealGroup[] = useMemo(() => {
    const map = new Map<string, Deal[]>();
    for (const deal of deals) {
      const arr = map.get(deal.watchId) || [];
      arr.push(deal);
      map.set(deal.watchId, arr);
    }

    const result: DealGroup[] = [];
    map.forEach((watchDeals: Deal[], watchId: string) => {
      // Sort by deal score descending within group
      watchDeals.sort((a: Deal, b: Deal) => b.dealScore - a.dealScore);
      const [best, ...others] = watchDeals;
      result.push({
        watchId,
        brand: best.brand,
        model: best.model,
        reference: best.reference,
        marketPrice: best.marketPrice,
        best,
        others,
      });
    });

    // Sort groups by best deal's score
    result.sort((a, b) => b.best.dealScore - a.best.dealScore);
    return result;
  }, [deals]);

  function toggleExpand(watchId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(watchId)) next.delete(watchId);
      else next.add(watchId);
      return next;
    });
  }

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
        <p className="text-sm text-gray-500">Best deal per watch · Click to see more listings</p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <MiniStat label="Watches" value={groups.length} />
          <MiniStat label="Total Deals" value={stats.totalDeals} />
          <MiniStat label="Hot Deals" value={stats.hotDeals} color="text-red-400" />
          <MiniStat label=">10% Under" value={stats.dealsAbove10} color="text-yellow-400" />
          <MiniStat label="Avg Discount" value={`${stats.avgDiscount}%`} color="text-green-400" />
          <MiniStat label="Avg Score" value={stats.avgScore} color="text-blue-400" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
            <label className="text-xs text-gray-500 block mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">All Conditions</option>
              <option value="New">New / Unworn</option>
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good / Pre-Owned</option>
              <option value="Fair">Fair</option>
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
      ) : groups.length === 0 ? (
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-12 text-center">
          <SearchIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No deals match your filters</p>
          <p className="text-sm text-gray-600 mt-1">Try lowering the minimum discount or expanding the price range</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden lg:block space-y-2">
            {groups.map((group) => {
              const isOpen = expanded.has(group.watchId);
              const deal = group.best;
              return (
                <div key={group.watchId} className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
                  {/* Best deal row */}
                  <div
                    className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition ${deal.badge === 'hot' ? 'deal-hot' : ''}`}
                    onClick={() => group.others.length > 0 && toggleExpand(group.watchId)}
                  >
                    <ScoreRing score={deal.dealScore} size={36} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/watches/${deal.watchId}`} className="hover:text-blue-400 transition" onClick={(e) => e.stopPropagation()}>
                          <span className="text-white font-semibold text-sm">{deal.brand} {deal.model}</span>
                        </Link>
                        {deal.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle(deal.badge)}`}>
                            {badgeLabel(deal.badge)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{deal.source} · Ref. {deal.reference}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-white font-semibold text-sm">{formatPrice(deal.listingPrice)}</div>
                      <div className="text-[10px] text-gray-500">Market: {formatPrice(deal.marketPrice)}</div>
                    </div>

                    <div className="w-32">
                      <PriceBar listingPrice={deal.listingPrice} marketPrice={deal.marketPrice} />
                    </div>

                    <span className={`inline-block px-2 py-0.5 rounded-md text-sm font-bold border ${discountBg(deal.discount)} ${discountColor(deal.discount)}`}>
                      -{deal.discount}%
                    </span>

                    <div className="text-green-400 text-sm font-medium w-20 text-right">
                      {formatPrice(deal.savings)}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <a href={deal.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 p-1" title="Open listing">
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => shareDeal(deal)} className="text-gray-500 hover:text-white p-1" title="Copy deal info">
                        {copiedId === deal.id ? <span className="text-green-400 text-[10px] font-bold">OK</span> : <CopyIcon className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expand chevron */}
                    {group.others.length > 0 ? (
                      <div className="text-gray-500 w-6 text-center">
                        <svg className={`w-4 h-4 mx-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        <div className="text-[9px] text-gray-600">{group.others.length} more</div>
                      </div>
                    ) : (
                      <div className="w-6" />
                    )}
                  </div>

                  {/* Expanded other deals */}
                  {isOpen && group.others.length > 0 && (
                    <div className="border-t border-gray-800/50 bg-[#0c0c12]">
                      {group.others.map((d) => (
                        <div key={d.id} className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-800/30 last:border-0 hover:bg-white/[0.02] transition">
                          <div className="w-9 flex justify-center">
                            <ScoreRing score={d.dealScore} size={28} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-gray-300 text-sm truncate">{d.source}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-white text-sm">{formatPrice(d.listingPrice)}</div>
                          </div>

                          <div className="w-32">
                            <PriceBar listingPrice={d.listingPrice} marketPrice={d.marketPrice} />
                          </div>

                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${discountBg(d.discount)} ${discountColor(d.discount)}`}>
                            -{d.discount}%
                          </span>

                          <div className="text-green-400 text-xs font-medium w-20 text-right">
                            {formatPrice(d.savings)}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 p-1">
                              <ExternalLinkIcon className="w-3.5 h-3.5" />
                            </a>
                            <button onClick={() => shareDeal(d)} className="text-gray-500 hover:text-white p-1">
                              {copiedId === d.id ? <span className="text-green-400 text-[10px] font-bold">OK</span> : <CopyIcon className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="w-6" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {groups.map((group) => {
              const isOpen = expanded.has(group.watchId);
              const deal = group.best;
              return (
                <div key={group.watchId} className={`bg-[#111118] border border-gray-800 rounded-xl overflow-hidden ${deal.badge === 'hot' ? 'deal-hot' : ''}`}>
                  <div className="p-4 space-y-3">
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

                  {/* Expand toggle */}
                  {group.others.length > 0 && (
                    <button
                      onClick={() => toggleExpand(group.watchId)}
                      className="w-full px-4 py-2 border-t border-gray-800/50 text-xs text-gray-400 hover:text-white hover:bg-white/[0.02] transition flex items-center justify-center gap-1"
                    >
                      <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      {isOpen ? 'Hide' : `${group.others.length} more deal${group.others.length > 1 ? 's' : ''}`}
                    </button>
                  )}

                  {/* Expanded deals */}
                  {isOpen && group.others.length > 0 && (
                    <div className="border-t border-gray-800/50 bg-[#0c0c12]">
                      {group.others.map((d) => (
                        <div key={d.id} className="px-4 py-3 border-b border-gray-800/30 last:border-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ScoreRing score={d.dealScore} size={28} />
                              <span className="text-gray-300 text-sm">{d.source}</span>
                            </div>
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${discountBg(d.discount)} ${discountColor(d.discount)}`}>
                              -{d.discount}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white">{formatPrice(d.listingPrice)}</span>
                            <span className="text-green-400 text-xs">Save {formatPrice(d.savings)}</span>
                          </div>
                          <div className="flex justify-end">
                            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs inline-flex items-center gap-1">
                              View <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="text-center text-xs text-gray-600">
        Showing {groups.length} watches · {deals.length} total deals
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
