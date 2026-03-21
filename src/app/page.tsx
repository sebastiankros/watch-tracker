'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice, discountColor, timeAgo } from '@/lib/utils';

interface DealSummary {
  id: string;
  watchId: string;
  brand: string;
  model: string;
  listingPrice: number;
  marketPrice: number;
  discount: number;
  source: string;
  url: string;
}

interface DashboardData {
  totalWatches: number;
  totalDeals: number;
  avgDiscount: number;
  marketTrend: 'up' | 'down' | 'flat';
  topDeals: DealSummary[];
  lastUpdated: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const [watchesRes, dealsRes] = await Promise.all([
        fetch('/api/watches'),
        fetch('/api/deals?minDiscount=5&sort=discount'),
      ]);
      const watchesData = await watchesRes.json();
      const dealsData = await dealsRes.json();

      // Calculate market trend
      const watches = watchesData.watches || [];
      let upCount = 0, downCount = 0;
      for (const w of watches) {
        if (w.previousPrice) {
          if (w.marketPrice > w.previousPrice) upCount++;
          else if (w.marketPrice < w.previousPrice) downCount++;
        }
      }
      const trend = upCount > downCount ? 'up' : downCount > upCount ? 'down' : 'flat';

      setData({
        totalWatches: watches.length,
        totalDeals: dealsData.stats?.dealsAbove5 || 0,
        avgDiscount: dealsData.stats?.avgDiscount || 0,
        marketTrend: trend,
        topDeals: (dealsData.deals || []).slice(0, 5),
        lastUpdated: watches[0]?.lastUpdated || new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch('/api/market/refresh');
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Updated {timeAgo(data.lastUpdated)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          {refreshing ? (
            <>
              <span className="animate-spin">↻</span> Refreshing...
            </>
          ) : (
            <>↻ Refresh Data</>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Watches Tracked"
          value={data.totalWatches.toString()}
          sub="active models"
          color="blue"
        />
        <StatCard
          label="Deals Found"
          value={data.totalDeals.toString()}
          sub="below market value"
          color="green"
        />
        <StatCard
          label="Avg. Discount"
          value={`${data.avgDiscount}%`}
          sub="on current deals"
          color="yellow"
        />
        <StatCard
          label="Market Trend"
          value={data.marketTrend === 'up' ? '↑ Rising' : data.marketTrend === 'down' ? '↓ Falling' : '→ Flat'}
          sub="7-day movement"
          color={data.marketTrend === 'up' ? 'green' : data.marketTrend === 'down' ? 'red' : 'gray'}
        />
      </div>

      {/* Top Deals */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Top 5 Deals</h2>
          <Link href="/deals" className="text-sm text-blue-400 hover:text-blue-300">
            View all →
          </Link>
        </div>
        {data.topDeals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No deals found. Try refreshing data.</div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {data.topDeals.map((deal, i) => (
              <div key={deal.id} className="flex items-center gap-4 px-5 py-3 deal-row">
                <span className="text-lg font-bold text-gray-600 w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link href={`/watches/${deal.watchId}`} className="text-white font-medium hover:text-blue-400 truncate block">
                    {deal.brand} {deal.model}
                  </Link>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {deal.source} · Listed at {formatPrice(deal.listingPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${discountColor(deal.discount)}`}>
                    -{deal.discount}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Market {formatPrice(deal.marketPrice)}
                  </div>
                </div>
                <a
                  href={deal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-400 text-sm"
                >
                  ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/deals" className="bg-[#111118] border border-gray-800 rounded-xl p-5 hover:border-green-500/30 transition group">
          <div className="text-2xl mb-2">🔥</div>
          <h3 className="text-white font-semibold group-hover:text-green-400 transition">Find Deals</h3>
          <p className="text-sm text-gray-500 mt-1">Browse undervalued watches for sale</p>
        </Link>
        <Link href="/market" className="bg-[#111118] border border-gray-800 rounded-xl p-5 hover:border-blue-500/30 transition group">
          <div className="text-2xl mb-2">📈</div>
          <h3 className="text-white font-semibold group-hover:text-blue-400 transition">Market Prices</h3>
          <p className="text-sm text-gray-500 mt-1">Track live market values and trends</p>
        </Link>
        <Link href="/alerts" className="bg-[#111118] border border-gray-800 rounded-xl p-5 hover:border-yellow-500/30 transition group">
          <div className="text-2xl mb-2">🔔</div>
          <h3 className="text-white font-semibold group-hover:text-yellow-400 transition">Set Alerts</h3>
          <p className="text-sm text-gray-500 mt-1">Get notified when prices drop</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/20 bg-blue-500/5',
    green: 'border-green-500/20 bg-green-500/5',
    yellow: 'border-yellow-500/20 bg-yellow-500/5',
    red: 'border-red-500/20 bg-red-500/5',
    gray: 'border-gray-500/20 bg-gray-500/5',
  };

  const textColor: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    gray: 'text-gray-400',
  };

  return (
    <div className={`border rounded-xl p-4 ${colorMap[color] || colorMap.gray}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textColor[color] || textColor.gray}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-1">{sub}</p>
    </div>
  );
}
