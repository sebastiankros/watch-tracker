'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, discountColor, discountBg, timeAgo } from '@/lib/utils';
import PriceChart from '@/components/PriceChart';

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

interface SoldRecord {
  id: string;
  price: number;
  source: string;
  soldDate: string;
  condition: string | null;
}

export default function WatchDetailPage() {
  const params = useParams();
  const [watch, setWatch] = useState<WatchDetail | null>(null);
  const [soldRecords, setSoldRecords] = useState<SoldRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/watches/${params.id}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setWatch(data.watch);
      setSoldRecords(data.soldRecords || []);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Loading watch details...</div>;
  }

  if (!watch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Watch not found</p>
        <Link href="/market" className="text-blue-400 text-sm mt-2 inline-block">← Back to Market</Link>
      </div>
    );
  }

  const chartData = watch.priceHistory.map((h) => ({
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: h.price,
    source: h.source,
  }));

  // Price sources breakdown
  const sourceMap = new Map<string, number[]>();
  watch.priceHistory.forEach((h) => {
    if (!sourceMap.has(h.source)) sourceMap.set(h.source, []);
    sourceMap.get(h.source)!.push(h.price);
  });
  const sources = Array.from(sourceMap.entries()).map(([source, prices]) => ({
    source,
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    count: prices.length,
    latest: prices[prices.length - 1],
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/market" className="hover:text-white">Market</Link>
        <span>/</span>
        <span className="text-white">{watch.brand} {watch.model}</span>
      </div>

      {/* Header */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{watch.brand} {watch.model}</h1>
            <p className="text-gray-500 text-sm mt-1">Ref. {watch.reference}</p>
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

        {/* Trend Pills */}
        <div className="flex gap-4 mt-4 flex-wrap">
          <TrendPill label="7d" current={watch.marketPrice} previous={watch.price7dAgo} />
          <TrendPill label="30d" current={watch.marketPrice} previous={watch.price30dAgo} />
          <TrendPill label="90d" current={watch.marketPrice} previous={watch.price90dAgo} />
        </div>
      </div>

      {/* Price History Chart */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Price History</h2>
        <PriceChart data={chartData} />
      </div>

      {/* Two Column: Listings + Sold Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Listings */}
        <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Active Listings ({watch.listings.length})</h2>
          </div>
          {watch.listings.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No active listings found</div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {watch.listings.map((listing) => {
                const discount = ((watch.marketPrice - listing.price) / watch.marketPrice) * 100;
                const isDeal = discount >= 5;
                return (
                  <div key={listing.id} className="px-5 py-3 deal-row">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold text-sm">{formatPrice(listing.price)}</div>
                      {isDeal && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${discountBg(discount)} ${discountColor(discount)}`}>
                          -{discount.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                      <span>{listing.source} · {listing.condition || 'N/A'} · {listing.seller || 'N/A'}</span>
                      <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        View ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Sold Prices */}
        <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Recent Sold Prices</h2>
          </div>
          {soldRecords.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No sold records found</div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {soldRecords.map((record) => (
                <div key={record.id} className="px-5 py-3 flex items-center justify-between deal-row">
                  <div>
                    <div className="text-white font-semibold text-sm">{formatPrice(record.price)}</div>
                    <div className="text-xs text-gray-500">{record.condition || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{record.source}</div>
                    <div className="text-xs text-gray-600">{new Date(record.soldDate).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price Sources Breakdown */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Price Sources Breakdown</h2>
        </div>
        <div className="divide-y divide-gray-800/50">
          {sources.map((s) => (
            <div key={s.source} className="px-5 py-3 flex items-center justify-between deal-row">
              <div>
                <div className="text-white text-sm font-medium">{s.source}</div>
                <div className="text-xs text-gray-500">{s.count} data points</div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold text-sm">{formatPrice(s.latest)}</div>
                <div className="text-xs text-gray-500">avg {formatPrice(s.avg)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendPill({ label, current, previous }: { label: string; current: number; previous: number | null }) {
  if (!previous) return null;
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct > 0;
  const color = isUp ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20';

  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${color}`}>
      <span>{label}:</span>
      <span>{isUp ? '+' : ''}{pct.toFixed(1)}%</span>
    </div>
  );
}
