'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { PlusIcon, TrashIcon, AlertIcon, SpinnerIcon } from '@/components/Icons';
import { cachedFetch } from '@/lib/api-cache';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Alert {
  id: string;
  watchId: string | null;
  brand: string | null;
  modelName: string | null;
  targetPrice: number | null;
  discountPct: number | null;
  isActive: boolean;
  lastTriggered: string | null;
  createdAt: string;
  watch: { brand: string; model: string; reference: string; marketPrice: number } | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);

  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formTargetPrice, setFormTargetPrice] = useState('');
  const [formDiscountPct, setFormDiscountPct] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadAlerts() {
    const res = await fetch('/api/alerts');
    const data = await res.json();
    setAlerts(data.alerts || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAlerts();
    cachedFetch<{ brands: string[] }>('/api/watches').then(d => setBrands(d.brands || []));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: formBrand || null,
          modelName: formModel || null,
          targetPrice: formTargetPrice ? Number(formTargetPrice) : null,
          discountPct: formDiscountPct ? Number(formDiscountPct) : null,
        }),
      });
      setFormBrand('');
      setFormModel('');
      setFormTargetPrice('');
      setFormDiscountPct('');
      setShowForm(false);
      await loadAlerts();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Alerts' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-sm text-gray-500">Get notified when prices drop or deals appear</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          New Alert
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Create New Alert</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Brand</label>
              <select
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Any Brand</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Model (optional)</label>
              <input
                type="text"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                placeholder="e.g. Black Bay 58"
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Target Price ($)</label>
              <input
                type="number"
                value={formTargetPrice}
                onChange={(e) => setFormTargetPrice(e.target.value)}
                placeholder="Alert when price drops below..."
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Min Discount %</label>
              <input
                type="number"
                value={formDiscountPct}
                onChange={(e) => setFormDiscountPct(e.target.value)}
                placeholder="Alert when discount exceeds..."
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg transition flex items-center gap-2"
            >
              {submitting && <SpinnerIcon className="w-4 h-4" />}
              Create Alert
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
          <SpinnerIcon className="w-5 h-5" /> Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-12 text-center">
          <AlertIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No alerts configured</p>
          <p className="text-sm text-gray-600 mt-1">Create an alert to get notified about deals</p>
        </div>
      ) : (
        <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800/50">
          {alerts.map((alert) => (
            <div key={alert.id} className="px-5 py-4 flex items-center justify-between deal-row">
              <div className="flex-1">
                <div className="text-white font-medium text-sm">
                  {alert.watch
                    ? `${alert.watch.brand} ${alert.watch.model}`
                    : alert.brand
                    ? `${alert.brand}${alert.modelName ? ` ${alert.modelName}` : ''}`
                    : 'Any Watch'
                  }
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {alert.targetPrice && (
                    <span>Target: {formatPrice(alert.targetPrice)}</span>
                  )}
                  {alert.discountPct && (
                    <span>Min discount: {alert.discountPct}%</span>
                  )}
                  {alert.watch && (
                    <span>Current market: {formatPrice(alert.watch.marketPrice)}</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Created {new Date(alert.createdAt).toLocaleDateString()}
                  {alert.lastTriggered && ` · Last triggered ${new Date(alert.lastTriggered).toLocaleDateString()}`}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  alert.isActive
                    ? 'text-green-400 bg-green-500/10 border-green-500/20'
                    : 'text-gray-500 bg-gray-500/10 border-gray-500/20'
                }`}>
                  {alert.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="text-gray-500 hover:text-red-400 transition p-1"
                  title="Delete alert"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#111118] border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3">Alert History</h3>
        <p className="text-sm text-gray-500">No alerts have been triggered yet. Create alerts above and they&apos;ll fire when matching deals appear.</p>
      </div>
    </div>
  );
}
