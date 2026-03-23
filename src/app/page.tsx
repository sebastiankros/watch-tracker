'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatPrice, discountColor, timeAgo, badgeLabel, badgeStyle } from '@/lib/utils';
import { WatchIcon, DealsIcon, MarketIcon, AlertIcon, RefreshIcon, SpinnerIcon, ExternalLinkIcon, TrendUpIcon, TrendDownIcon, ArrowRightIcon, SearchIcon } from '@/components/Icons';
import { SkeletonDashboard } from '@/components/Skeleton';
import ScoreRing from '@/components/ScoreRing';

interface DealSummary {
  id: string;
  watchId: string;
  brand: string;
  model: string;
  listingPrice: number;
  marketPrice: number;
  discount: number;
  savings: number;
  dealScore: number;
  badge: string | null;
  source: string;
  url: string;
}

interface DashboardData {
  totalWatches: number;
  totalDeals: number;
  avgDiscount: number;
  avgScore: number;
  hotDeals: number;
  marketTrend: 'up' | 'down' | 'flat';
  topDeals: DealSummary[];
  lastUpdated: string;
}

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL / 1000);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('watchlist');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [watchesRes, dealsRes] = await Promise.all([
        fetch('/api/watches'),
        fetch('/api/deals?minDiscount=3&sort=score'),
      ]);
      const watchesData = await watchesRes.json();
      const dealsData = await dealsRes.json();

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
        totalDeals: dealsData.stats?.totalDeals || 0,
        avgDiscount: dealsData.stats?.avgDiscount || 0,
        avgScore: dealsData.stats?.avgScore || 0,
        hotDeals: dealsData.stats?.hotDeals || 0,
        marketTrend: trend,
        topDeals: (dealsData.deals || []).slice(0, 8),
        lastUpdated: watches[0]?.lastUpdated || new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch('/api/market/refresh');
      await loadData();
      setCountdown(AUTO_REFRESH_INTERVAL / 1000);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadData();
          return AUTO_REFRESH_INTERVAL / 1000;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loadData]);

  if (loading) return <SkeletonDashboard />;
  if (!data) return null;

  const countdownMin = Math.floor(countdown / 60);
  const countdownSec = countdown % 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Updated {timeAgo(data.lastUpdated)} · next refresh in {countdownMin}:{String(countdownSec).padStart(2, '0')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="bg-[#111118] border border-gray-700 hover:border-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <SearchIcon className="w-4 h-4" /> Search
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            {refreshing ? (
              <><SpinnerIcon className="w-4 h-4" /> Refreshing...</>
            ) : (
              <><RefreshIcon className="w-4 h-4" /> Refresh</>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/market">
          <StatCard
            label="Watches Tracked"
            value={data.totalWatches.toString()}
            sub="active models"
            color="blue"
            Icon={WatchIcon}
          />
        </Link>
        <Link href="/deals">
          <StatCard
            label="Deals Found"
            value={data.totalDeals.toString()}
            sub={data.hotDeals > 0 ? `${data.hotDeals} hot deal${data.hotDeals > 1 ? 's' : ''}` : 'below market value'}
            color="green"
            Icon={DealsIcon}
          />
        </Link>
        <Link href="/deals?sort=score">
          <StatCard
            label="Avg Deal Score"
            value={data.avgScore.toString()}
            sub="out of 100"
            color="yellow"
            Icon={TagIcon}
          />
        </Link>
        <Link href="/market">
          <StatCard
            label="Market Trend"
            value={data.marketTrend === 'up' ? 'Rising' : data.marketTrend === 'down' ? 'Falling' : 'Stable'}
            sub="7-day movement"
            color={data.marketTrend === 'up' ? 'green' : data.marketTrend === 'down' ? 'red' : 'gray'}
            Icon={data.marketTrend === 'down' ? TrendDownIcon : TrendUpIcon}
          />
        </Link>
      </div>

      {/* Favorites Quick Access */}
      {favorites.length > 0 && (
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Your Watchlist</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {favorites.map((id) => (
              <Link
                key={id}
                href={`/watches/${id}`}
                className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-400 hover:bg-yellow-500/20 transition"
              >
                {id.replace('watch_', '').replace(/_/g, ' ')}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top Deals */}
      <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Top Deals</h2>
          <Link href="/deals" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View all <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>
        {data.topDeals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No deals found yet.</p>
            <p className="text-sm mt-1">Deals appear as market data loads. Try refreshing.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {data.topDeals.map((deal) => (
              <div key={deal.id} className={`flex items-center gap-4 px-5 py-3 deal-row ${deal.badge === 'hot' ? 'deal-hot' : ''}`}>
                <ScoreRing score={deal.dealScore} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/watches/${deal.watchId}`} className="text-white font-medium hover:text-blue-400 truncate">
                      {deal.brand} {deal.model}
                    </Link>
                    {deal.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle(deal.badge)}`}>
                        {badgeLabel(deal.badge)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {deal.source} · {formatPrice(deal.listingPrice)}
                    <span className="text-gray-600 mx-1">vs</span>
                    {formatPrice(deal.marketPrice)} market
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${discountColor(deal.discount)}`}>
                    -{deal.discount}%
                  </div>
                  <div className="text-xs text-green-400/70">
                    Save {formatPrice(deal.savings)}
                  </div>
                </div>
                <a
                  href={deal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-400 p-1"
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/deals" className="bg-[#111118] border border-gray-800 rounded-xl p-5 hover:border-green-500/30 transition group">
          <DealsIcon className="w-8 h-8 text-green-400 mb-3" />
          <h3 className="text-white font-semibold group-hover:text-green-400 transition">Find Deals</h3>
          <p className="text-sm text-gray-500 mt-1">Browse undervalued watches with deal scores</p>
        </Link>
        <Link href="/market" className="bg-[#111118] border border-gray-800 rounded-xl p-5 hover:border-blue-500/30 transition group">
          <MarketIcon className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-white font-semibold group-hover:text-blue-400 transition">Market Prices</h3>
          <p className="text-sm text-gray-500 mt-1">Track live market values and trends</p>
        </Link>
        <Link href="/alerts" className="bg-[#111118] border border-gray-800 rounded-xl p-5 hover:border-yellow-500/30 transition group">
          <AlertIcon className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-white font-semibold group-hover:text-yellow-400 transition">Set Alerts</h3>
          <p className="text-sm text-gray-500 mt-1">Get notified when prices drop</p>
        </Link>
      </div>
    </div>
  );
}

function TagIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  Icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40',
    green: 'border-green-500/20 bg-green-500/5 hover:border-green-500/40',
    yellow: 'border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/40',
    red: 'border-red-500/20 bg-red-500/5 hover:border-red-500/40',
    gray: 'border-gray-500/20 bg-gray-500/5 hover:border-gray-500/40',
  };

  const textColor: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    gray: 'text-gray-400',
  };

  const iconColor: Record<string, string> = {
    blue: 'text-blue-400/50',
    green: 'text-green-400/50',
    yellow: 'text-yellow-400/50',
    red: 'text-red-400/50',
    gray: 'text-gray-400/50',
  };

  return (
    <div className={`border rounded-xl p-4 transition cursor-pointer ${colorMap[color] || colorMap.gray}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <Icon className={`w-4 h-4 ${iconColor[color] || iconColor.gray}`} />
      </div>
      <p className={`text-2xl font-bold mt-1 ${textColor[color] || textColor.gray}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-1">{sub}</p>
    </div>
  );
}
