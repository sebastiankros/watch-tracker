'use client';

import { useEffect, useState } from 'react';
import { SpinnerIcon, SettingsIcon } from '@/components/Icons';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Settings {
  refreshInterval: number;
  minDiscountPct: number;
  preferredBrands: string;
  alertEmail: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()),
      fetch('/api/watches').then(r => r.json()),
    ]).then(([settingsData, watchesData]) => {
      setSettings(settingsData.settings);
      setBrands(watchesData.brands || []);
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  function toggleBrand(brand: string) {
    if (!settings) return;
    const current = settings.preferredBrands ? settings.preferredBrands.split(',').filter(Boolean) : [];
    const updated = current.includes(brand)
      ? current.filter((b) => b !== brand)
      : [...current, brand];
    setSettings({ ...settings, preferredBrands: updated.join(',') });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerIcon className="w-6 h-6 text-gray-500" />
      </div>
    );
  }

  if (!settings) return null;

  const selectedBrands = settings.preferredBrands ? settings.preferredBrands.split(',').filter(Boolean) : [];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Settings' }]} />

      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500">Configure your tracker preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-gray-500" />
            Data Refresh
          </h3>
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
              <option value={720}>Every 12 hours</option>
              <option value={1440}>Once a day</option>
            </select>
          </div>
        </div>

        <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Deal Thresholds</h3>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Minimum Discount % to Show in Deals</label>
            <select
              value={settings.minDiscountPct}
              onChange={(e) => setSettings({ ...settings, minDiscountPct: Number(e.target.value) })}
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value={0}>Show all (0%+)</option>
              <option value={3}>3%+</option>
              <option value={5}>5%+ (recommended)</option>
              <option value={10}>10%+</option>
              <option value={15}>15%+</option>
              <option value={20}>20%+</option>
            </select>
          </div>
        </div>

        <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Preferred Brands</h3>
          <p className="text-xs text-gray-500">Selected brands are prioritized in results</p>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => {
              const isSelected = selectedBrands.includes(brand);
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    isSelected
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/30'
                      : 'bg-[#0a0a0f] text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {brand}
                </button>
              );
            })}
          </div>
          {selectedBrands.length > 0 && (
            <p className="text-xs text-gray-500">{selectedBrands.length} brand{selectedBrands.length !== 1 ? 's' : ''} selected</p>
          )}
        </div>

        <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Email Alerts</h3>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Alert Email Address</label>
            <input
              type="email"
              value={settings.alertEmail}
              onChange={(e) => setSettings({ ...settings, alertEmail: e.target.value })}
              placeholder="you@example.com"
              className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600"
            />
          </div>
          <p className="text-xs text-gray-600">Deal alerts will be sent to this email via Resend</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-6 py-2.5 rounded-lg transition flex items-center gap-2"
          >
            {saving && <SpinnerIcon className="w-4 h-4" />}
            Save Settings
          </button>
          {saved && (
            <span className="text-green-400 text-sm">Settings saved</span>
          )}
        </div>
      </form>
    </div>
  );
}
