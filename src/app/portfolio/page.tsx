'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice, timeAgo } from '@/lib/utils';
import { SpinnerIcon, TrashIcon, ExternalLinkIcon } from '@/components/Icons';
import Breadcrumbs from '@/components/Breadcrumbs';

interface PortfolioEntry {
  id: string;
  watchId: string | null;
  brand: string;
  model: string;
  reference: string;
  purchasePrice: number;
  purchaseDate: string;
  purchaseSource: string;
  purchaseUrl: string | null;
  soldPrice: number | null;
  soldDate: string | null;
  soldSource: string | null;
  fees: number;
  notes: string;
  status: 'holding' | 'sold';
  createdAt: string;
  currentMarketPrice: number | null;
  profit: number | null;
  profitPct: number | null;
  roi: number | null;
  unrealizedProfit: number | null;
  unrealizedPct: number | null;
}

interface Stats {
  holdingCount: number;
  soldCount: number;
  totalInvested: number;
  totalMarketValue: number;
  unrealizedPL: number;
  unrealizedPLPct: number;
  realizedPL: number;
  realizedPLPct: number;
  totalFees: number;
}

export default function PortfolioPage() {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'holding' | 'sold' | 'all'>('holding');
  const [sellModal, setSellModal] = useState<PortfolioEntry | null>(null);

  async function loadPortfolio() {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      setEntries(data.entries || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
    await loadPortfolio();
  }

  const filtered = tab === 'all' ? entries : entries.filter((e) => e.status === tab);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Portfolio' }]} />

      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <p className="text-sm text-gray-500">Track purchases, sales, and profit/loss</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Invested" value={formatPrice(stats.totalInvested)} />
          <StatCard
            label="Market Value"
            value={formatPrice(stats.totalMarketValue)}
            color={stats.totalMarketValue >= stats.totalInvested ? 'text-green-400' : 'text-red-400'}
          />
          <StatCard
            label="Unrealized P&L"
            value={`${stats.unrealizedPL >= 0 ? '+' : ''}${formatPrice(stats.unrealizedPL)}`}
            sub={`${stats.unrealizedPLPct >= 0 ? '+' : ''}${stats.unrealizedPLPct}%`}
            color={stats.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}
          />
          <StatCard
            label="Realized P&L"
            value={`${stats.realizedPL >= 0 ? '+' : ''}${formatPrice(stats.realizedPL)}`}
            sub={`${stats.realizedPLPct >= 0 ? '+' : ''}${stats.realizedPLPct}% · ${formatPrice(stats.totalFees)} fees`}
            color={stats.realizedPL >= 0 ? 'text-green-400' : 'text-red-400'}
          />
          <StatCard
            label="Watches"
            value={`${stats.holdingCount} holding · ${stats.soldCount} sold`}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111118] border border-gray-800 rounded-lg p-1 w-fit">
        {(['holding', 'sold', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              tab === t ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-white'
            }`}
          >
            {t === 'holding' ? 'Holding' : t === 'sold' ? 'Sold' : 'All'}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
          <SpinnerIcon className="w-5 h-5" /> Loading portfolio...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-3xl mb-3">&#128188;</p>
          <p className="text-gray-400">
            {entries.length === 0
              ? 'Your portfolio is empty'
              : `No ${tab === 'holding' ? 'holdings' : 'sold watches'}`}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {entries.length === 0
              ? 'Browse deals or watches and click "Bought" to track a purchase'
              : 'Switch tabs to see your other entries'}
          </p>
          {entries.length === 0 && (
            <Link href="/deals" className="text-blue-400 text-sm mt-3 inline-block">Browse Deals</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className={`bg-[#111118] border rounded-xl p-5 ${
                entry.status === 'sold'
                  ? entry.profit !== null && entry.profit >= 0
                    ? 'border-green-500/20'
                    : 'border-red-500/20'
                  : 'border-gray-800'
              }`}
            >
              {/* Top Row: Watch + P&L */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={entry.watchId ? `/watches/${entry.watchId}` : '/market'}
                      className="text-white font-semibold hover:text-blue-400 transition"
                    >
                      {entry.brand} {entry.model}
                    </Link>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      entry.status === 'holding'
                        ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                        : 'text-gray-400 bg-gray-500/10 border-gray-500/20'
                    }`}>
                      {entry.status === 'holding' ? 'HOLDING' : 'SOLD'}
                    </span>
                  </div>
                  {entry.reference && (
                    <div className="text-xs text-gray-500 mt-0.5">Ref. {entry.reference}</div>
                  )}
                </div>

                {/* P&L Display */}
                <div className="text-right">
                  {entry.status === 'sold' && entry.profit !== null ? (
                    <>
                      <div className={`text-lg font-bold ${entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.profit >= 0 ? '+' : ''}{formatPrice(entry.profit)}
                      </div>
                      <div className={`text-xs ${entry.profitPct !== null && entry.profitPct >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                        {entry.profitPct !== null && entry.profitPct >= 0 ? '+' : ''}{entry.profitPct}% ROI
                      </div>
                    </>
                  ) : entry.unrealizedProfit !== null ? (
                    <>
                      <div className={`text-lg font-bold ${entry.unrealizedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.unrealizedProfit >= 0 ? '+' : ''}{formatPrice(entry.unrealizedProfit)}
                      </div>
                      <div className={`text-xs ${entry.unrealizedPct !== null && entry.unrealizedPct >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                        {entry.unrealizedPct !== null && entry.unrealizedPct >= 0 ? '+' : ''}{entry.unrealizedPct}% unrealized
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">No market data</div>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-gray-800/50">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Bought</div>
                  <div className="text-sm text-white font-medium">{formatPrice(entry.purchasePrice)}</div>
                  <div className="text-[10px] text-gray-600">
                    {new Date(entry.purchaseDate).toLocaleDateString()}
                    {entry.purchaseSource ? ` · ${entry.purchaseSource}` : ''}
                  </div>
                </div>

                {entry.fees > 0 && (
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Fees</div>
                    <div className="text-sm text-orange-400 font-medium">{formatPrice(entry.fees)}</div>
                    <div className="text-[10px] text-gray-600">Total cost: {formatPrice(entry.purchasePrice + entry.fees)}</div>
                  </div>
                )}

                {entry.status === 'sold' && entry.soldPrice !== null ? (
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Sold</div>
                    <div className="text-sm text-white font-medium">{formatPrice(entry.soldPrice)}</div>
                    <div className="text-[10px] text-gray-600">
                      {entry.soldDate ? new Date(entry.soldDate).toLocaleDateString() : ''}
                      {entry.soldSource ? ` · ${entry.soldSource}` : ''}
                    </div>
                  </div>
                ) : entry.currentMarketPrice ? (
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Market</div>
                    <div className="text-sm text-white font-medium">{formatPrice(entry.currentMarketPrice)}</div>
                    <div className="text-[10px] text-gray-600">current value</div>
                  </div>
                ) : null}

                {entry.status === 'sold' && entry.profit !== null && (
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Net Profit</div>
                    <div className={`text-sm font-bold ${entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.profit >= 0 ? '+' : ''}{formatPrice(entry.profit)}
                    </div>
                    <div className="text-[10px] text-gray-600">after fees</div>
                  </div>
                )}
              </div>

              {entry.notes && (
                <div className="text-xs text-gray-500 mt-2 italic">{entry.notes}</div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/50">
                <div className="flex items-center gap-2">
                  {entry.status === 'holding' && (
                    <button
                      onClick={() => setSellModal(entry)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      Mark as Sold
                    </button>
                  )}
                  {entry.purchaseUrl && (
                    <a
                      href={entry.purchaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1"
                    >
                      <ExternalLinkIcon className="w-3 h-3" /> Listing
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-gray-600 hover:text-red-400 transition p-1"
                  title="Delete entry"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sell Modal */}
      {sellModal && (
        <SellModal
          entry={sellModal}
          onClose={() => setSellModal(null)}
          onSold={() => { setSellModal(null); loadPortfolio(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-[#111118] border border-gray-800 rounded-lg px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold ${color || 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function SellModal({
  entry,
  onClose,
  onSold,
}: {
  entry: PortfolioEntry;
  onClose: () => void;
  onSold: () => void;
}) {
  const [soldPrice, setSoldPrice] = useState('');
  const [soldSource, setSoldSource] = useState('');
  const [soldDate, setSoldDate] = useState(new Date().toISOString().split('T')[0]);
  const [fees, setFees] = useState(entry.fees.toString());
  const [submitting, setSubmitting] = useState(false);

  const previewProfit = soldPrice
    ? Number(soldPrice) - entry.purchasePrice - (Number(fees) || 0)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!soldPrice) return;
    setSubmitting(true);
    try {
      await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sell',
          id: entry.id,
          soldPrice: Number(soldPrice),
          soldDate: new Date(soldDate).toISOString(),
          soldSource,
          fees: Number(fees) || 0,
        }),
      });
      onSold();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111118] border border-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Mark as Sold</h2>
          <p className="text-sm text-gray-500">{entry.brand} {entry.model} · Bought for {formatPrice(entry.purchasePrice)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Sold Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                  placeholder="0"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Sold Date</label>
              <input
                type="date"
                value={soldDate}
                onChange={(e) => setSoldDate(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Sold On</label>
              <input
                type="text"
                value={soldSource}
                onChange={(e) => setSoldSource(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500"
                placeholder="eBay, Chrono24, local, etc."
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Total Fees</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Profit Preview */}
          {previewProfit !== null && (
            <div className={`text-center py-3 rounded-lg border ${
              previewProfit >= 0
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="text-xs text-gray-500 mb-1">Estimated Profit</div>
              <div className={`text-2xl font-bold ${previewProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {previewProfit >= 0 ? '+' : ''}{formatPrice(previewProfit)}
              </div>
              <div className="text-xs text-gray-500">
                {((previewProfit / entry.purchasePrice) * 100).toFixed(1)}% ROI
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !soldPrice}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {submitting ? <SpinnerIcon className="w-4 h-4" /> : null}
              Confirm Sale
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-400 hover:text-white text-sm rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
