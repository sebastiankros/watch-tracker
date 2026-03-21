'use client';

import { useEffect, useState } from 'react';

interface Settings {
  refreshInterval: number;
  minDiscountPct: number;
  preferredBrands: string;
  alertEmail: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    refreshInterval: 60,
    minDiscountPct: 5,
    preferredBrands: '',
    alertEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()),
      fetch('/api/watches').then(r => r.json()),
    ]).then(([settingsData, watchesData]) => {
      if (settingsData.settings) setSettings(settingsData.settings);
      setBrands(watchesData.brands || []);
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const selectedBrands = settings.preferredBrands ? settings.preferredBrands.split(',').filter(Boolean) : [];

  function toggleBrand(brand: string) {
    const current = new Set(selectedBrands);
    if (current.has(brand)) current.delete(brand);
    else current.add(brand);
    setSettings({ ...settings, preferredBrands: Array.from(current).join(',') });
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500">Configure your watch tracker preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Data Refresh */}
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Data Refresh</h3>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Refresh Interval (minutes)</label>
            <select
              value={settings.refreshInterval}
              onChange={(e) => setSettings({ ...settings, refreshInterval: Number(e.target.value) })}
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
              <option value={120}>Every 2 hours</option>
              <option value={360}>Every 6 hours</option>
              <option value={1440}>Once daily</option>
            </select>
          </div>
        </div>

        {/* Deal Thresholds */}
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Deal Thresholds</h3>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Minimum Discount % to Show in Deals</label>
            <input
              type="number"
              min={0}
              max={50}
              step={1}
              value={settings.minDiscountPct}
              onChange={(e) => setSettings({ ...settings, minDiscountPct: Number(e.target.value) })}
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <p className="text-xs text-gray-600 mt-1">Listings below this discount will be hidden from the Deals page</p>
          </div>
        </div>

        {/* Preferred Brands */}
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Preferred Brands</h3>
          <p className="text-xs text-gray-500">Select brands to prioritize in your deal alerts</p>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => toggleBrand(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  selectedBrands.includes(b)
                    ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                    : 'bg-[#0a0a0f] border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Notifications</h3>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email for Deal Alerts</label>
            <input
              type="email"
              value={settings.alertEmail}
              onChange={(e) => setSettings({ ...settings, alertEmail: e.target.value })}
              placeholder="your@email.com"
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <p className="text-xs text-gray-600 mt-1">Receive email notifications when deals match your alerts</p>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-6 py-2.5 rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="text-green-400 text-sm">Settings saved!</span>}
        </div>
      </form>
    </div>
  );
}
