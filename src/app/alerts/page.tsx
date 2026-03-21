'use client';

import { useEffect, useState } from 'react';
import { formatPrice, timeAgo } from '@/lib/utils';

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

  // Form state
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [discountPct, setDiscountPct] = useState('10');
  const [brands, setBrands] = useState<string[]>([]);

  async function loadAlerts() {
    const res = await fetch('/api/alerts');
    const data = await res.json();
    setAlerts(data.alerts || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAlerts();
    fetch('/api/watches').then(r => r.json()).then(d => setBrands(d.brands || []));
  }, []);

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: brand || null,
        modelName: modelName || null,
        targetPrice: targetPrice ? Number(targetPrice) : null,
        discountPct: discountPct ? Number(discountPct) : null,
      }),
    });
    setBrand('');
    setModelName('');
    setTargetPrice('');
    setDiscountPct('10');
    setShowForm(false);
    loadAlerts();
  }

  async function deleteAlert(id: string) {
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
    loadAlerts();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-sm text-gray-500">Get notified when deals match your criteria</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {/* Create Alert Form */}
      {showForm && (
        <form onSubmit={createAlert} className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Create New Alert</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Brand</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Any Brand</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Model (optional)</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. Submariner"
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Target Price (USD)</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g. 12000"
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Minimum Discount %</label>
              <input
                type="number"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                placeholder="e.g. 10"
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm px-6 py-2 rounded-lg transition">
            Create Alert
          </button>
        </form>
      )}

      {/* Alerts List */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-gray-400">No alerts set up yet</p>
          <p className="text-sm text-gray-600 mt-1">Create an alert to get notified about watch deals</p>
        </div>
      ) : (
        <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800/50">
          {alerts.map((alert) => (
            <div key={alert.id} className="px-5 py-4 flex items-center justify-between deal-row">
              <div>
                <div className="text-white font-medium text-sm">
                  {alert.watch
                    ? `${alert.watch.brand} ${alert.watch.model}`
                    : alert.brand
                    ? `${alert.brand}${alert.modelName ? ` ${alert.modelName}` : ''}`
                    : 'All watches'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                  {alert.targetPrice && <span>Target: {formatPrice(alert.targetPrice)}</span>}
                  {alert.discountPct && <span>Min discount: {alert.discountPct}%</span>}
                  <span>Created {timeAgo(alert.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${alert.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>
                  {alert.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="text-gray-500 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
