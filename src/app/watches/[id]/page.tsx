'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, discountColor, discountBg, timeAgo } from '@/lib/utils';
import PriceChart from '@/components/PriceChart';
import PriceDistribution from '@/components/PriceDistribution';
import PriceBar from '@/components/PriceBar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ExternalLinkIcon, SpinnerIcon, CopyIcon } from '@/components/Icons';

interface WatchDetail {
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
  priceHistory: Array<{ id: string; price: number; source: string; date: string }>;
  listings: Array<{
    id: string;
    source: string;
    title: string;
    price: number;
    url: string;
    seller: string | null;
    condition: string | null;
    listedDate: string;
  }>;
}

export default function WatchDetailPage() {
  const params = useParams();
  const [watch, setWatch] = useState<WatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/watches/${params.id}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setWatch(data.watch);
      setLoading(false);
    }
    load();
  }, [params.id]);

  // Load favorite state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('watchlist');
      if (saved) {
        const list: string[] = JSON.parse(saved);
        setIsFavorite(list.includes(params.id as string));
      }
    } catch {}
  }, [params.id]);

  function toggleFavorite() {
    try {
      const saved = localStorage.getItem('watchlist');
      const list: string[] = saved ? JSON.parse(saved) : [];
      const id = params.id as string;
      const updated = list.includes(id)
        ? list.filter((x) => x !== id)
        : [...list, id];
      localStorage.setItem('watchlist', JSON.stringify(updated));
      setIsFavorite(!isFavorite);
    } catch {}
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerIcon className="w-6 h-6 text-gray-500" />
      </div>
    );
  }

  if (!watch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Watch not found or still loading.</p>
        <p className="text-sm text-gray-600 mt-1">Try refreshing from the dashboard to load market data.</p>
        <Link href="/market" className="text-blue-400 text-sm mt-2 inline-block">Back to Market</Link>
      </div>
    );
  }

  const chartData = watch.priceHistory.map((h) => ({
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: h.price,
    source: h.source,
  }));

  const listingPrices = watch.listings.map((l) => l.price).filter(Boolean);
  const sortedListings = [...watch.listings].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedListings[0]?.price;
  const highestPrice = sortedListings[sortedListings.length - 1]?.price;
  const belowMarket = sortedListings.filter((l) => l.price < watch.marketPrice).length;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Market', href: '/market' },
        { label: `${watch.brand} ${watch.model}` },
      ]} />

      {/* Header */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{watch.brand} {watch.model}</h1>
              <button
                onClick={toggleFavorite}
                className={`text-xl transition ${isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-600 hover:text-yellow-400'}`}
                title={isFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                {isFavorite ? '\u2605' : '\u2606'}
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-1">Ref. {watch.reference}</p>
            <div className="flex gap-4 mt-3 flex-wrap">
              <TrendPill label="7d" current={watch.marketPrice} previous={watch.price7dAgo} />
              <TrendPill label="30d" current={watch.marketPrice} previous={watch.price30dAgo} />
              <TrendPill label="90d" current={watch.marketPrice} previous={watch.price90dAgo} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{formatPrice(watch.marketPrice)}</div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-xs text-gray-500">Confidence</span>
              <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${watch.confidence * 100}%` }} />
              </div>
              <span className="text-xs text-gray-400">{Math.round(watch.confidence * 100)}%</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Updated {timeAgo(watch.lastUpdated)}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-800">
          <div className="text-center">
            <div className="text-xs text-gray-500">Listings</div>
            <div className="text-lg font-bold text-white">{watch.listings.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Below Market</div>
            <div className="text-lg font-bold text-green-400">{belowMarket}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Lowest</div>
            <div className="text-lg font-bold text-green-400">{lowestPrice ? formatPrice(lowestPrice) : 'N/A'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Highest</div>
            <div className="text-lg font-bold text-red-400">{highestPrice ? formatPrice(highestPrice) : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Price Distribution + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Price Distribution</h2>
          <PriceDistribution prices={listingPrices} marketPrice={watch.marketPrice} />
        </div>
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Price History</h2>
          <PriceChart data={chartData} />
        </div>
      </div>

      {/* Active Listings */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Active Listings ({watch.listings.length})</h2>
          <div className="text-xs text-gray-500">Sorted by price (low to high)</div>
        </div>
        {sortedListings.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No active listings found</div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {sortedListings.map((listing) => {
              const discount = ((watch.marketPrice - listing.price) / watch.marketPrice) * 100;
              const isDeal = discount >= 5;
              const isGreatDeal = discount >= 10;
              return (
                <div key={listing.id} className={`px-5 py-3 deal-row ${isGreatDeal ? 'deal-hot' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-white font-semibold text-sm">{formatPrice(listing.price)}</div>
                        {isDeal && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${discountBg(discount)} ${discountColor(discount)}`}>
                            -{discount.toFixed(1)}%
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="text-xs text-green-400/70">Save {formatPrice(watch.marketPrice - listing.price)}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate max-w-md">
                        {listing.title}
                      </div>
                    </div>
                    <div className="w-32 hidden md:block">
                      <PriceBar listingPrice={listing.price} marketPrice={watch.marketPrice} />
                    </div>
                    <div className="text-xs text-gray-500 hidden md:block w-20 text-center">
                      {listing.source}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => copyUrl(listing.url)}
                        className="text-gray-500 hover:text-white p-1"
                        title="Copy link"
                      >
                        {copiedUrl === listing.url ? (
                          <span className="text-green-400 text-[10px]">Copied</span>
                        ) : (
                          <CopyIcon className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 p-1">
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TrendPill({ label, current, previous }: { label: string; current: number; previous: number | null }) {
  if (!previous) return null;
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct > 0;
  const color = isUp ? 'text-green-400 bg-green-500/10 border-green-500/20' : pct < 0 ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-gray-400 bg-gray-500/10 border-gray-500/20';

  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${color}`}>
      <span>{label}:</span>
      <span>{isUp ? '+' : ''}{pct.toFixed(1)}%</span>
    </div>
  );
}
