'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatPrice } from '@/lib/utils';
import { getListedWatches, removeListedWatch, updateListedWatches, type ListedWatch } from '@/lib/listed';
import { ExternalLinkIcon, TrashIcon, RefreshIcon, SpinnerIcon, SearchIcon } from '@/components/Icons';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ListedPage() {
  const [watches, setWatches] = useState<ListedWatch[]>([]);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  useEffect(() => {
    setWatches(getListedWatches());
  }, []);

  const checkAvailability = useCallback(async () => {
    if (watches.length === 0) return;
    setChecking(true);
    try {
      const payload = watches.map(w => ({ id: w.id, sourceUrl: w.sourceUrl }));
      const res = await fetch('/api/listed/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watches: payload }),
      });
      const data = await res.json();
      if (data.results) {
        updateListedWatches(data.results);
        setWatches(getListedWatches());
        setLastCheck(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Check failed:', err);
    } finally {
      setChecking(false);
    }
  }, [watches]);

  function handleRemove(id: string) {
    removeListedWatch(id);
    setWatches(getListedWatches());
  }

  const available = watches.filter(w => w.available);
  const unavailable = watches.filter(w => !w.available);
  const totalValue = watches.reduce((s, w) => s + w.listPrice, 0);
  const totalProfit = watches.reduce((s, w) => s + (w.listPrice - w.purchasePrice), 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Listed Watches' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Listed Watches</h1>
          <p className="text-sm text-gray-500">Watches you&apos;ve listed on your marketplace</p>
        </div>
        <button
          onClick={checkAvailability}
          disabled={checking || watches.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition"
        >
          {checking ? <SpinnerIcon className="w-4 h-4" /> : <RefreshIcon className="w-4 h-4" />}
          Check Availability
        </button>
      </div>

      {/* Stats */}
      {watches.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Total Listed" value={watches.length} />
          <StatCard label="Available" value={available.length} color="text-green-400" />
          <StatCard label="Unavailable" value={unavailable.length} color={unavailable.length > 0 ? 'text-red-400' : 'text-gray-400'} />
          <StatCard label="Listed Value" value={formatPrice(totalValue)} color="text-blue-400" />
          <StatCard label="Expected Profit" value={formatPrice(totalProfit)} color={totalProfit > 0 ? 'text-green-400' : 'text-red-400'} />
        </div>
      )}

      {lastCheck && (
        <p className="text-xs text-gray-500">Last checked: {lastCheck}</p>
      )}

      {/* Watches List */}
      {watches.length === 0 ? (
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-12 text-center">
          <SearchIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No watches listed yet</p>
          <p className="text-sm text-gray-600 mt-1">Go to Deals and click &quot;List on Store&quot; on watches you want to track</p>
        </div>
      ) : (
        <div className="space-y-2">
          {watches.map((w) => {
            const profit = w.listPrice - w.purchasePrice;
            const margin = w.purchasePrice > 0 ? ((profit / w.purchasePrice) * 100).toFixed(1) : '0';
            return (
              <div
                key={w.id}
                className={`bg-[#111118] border rounded-xl px-4 py-3 flex items-center gap-4 ${
                  w.available ? 'border-gray-800' : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${w.available ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />

                {/* Watch info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{w.brand} {w.model}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      w.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {w.available ? 'AVAILABLE' : 'GONE'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{w.source} · Listed {new Date(w.dateListed).toLocaleDateString()}</div>
                </div>

                {/* Prices */}
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-500">Bought</div>
                  <div className="text-white text-sm">{formatPrice(w.purchasePrice)}</div>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-500">Listed At</div>
                  <div className="text-blue-400 text-sm font-medium">{formatPrice(w.listPrice)}</div>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-500">Profit</div>
                  <div className={`text-sm font-medium ${profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPrice(profit)} ({margin}%)
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <a href={w.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 p-1.5" title="View source listing">
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => handleRemove(w.id)} className="text-gray-500 hover:text-red-400 p-1.5" title="Remove from list">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unavailable.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <h3 className="text-red-400 font-semibold text-sm mb-2">Action Required</h3>
          <p className="text-sm text-gray-300">
            {unavailable.length} watch{unavailable.length > 1 ? 'es' : ''} may no longer be available at the source.
            The listing may have been sold or removed. Check the source link and remove if confirmed.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-[#111118] border border-gray-800 rounded-lg px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xl font-bold ${color || 'text-white'}`}>{value}</div>
    </div>
  );
}
