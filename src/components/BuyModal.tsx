'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerIcon } from './Icons';

interface BuyModalProps {
  brand: string;
  model: string;
  reference: string;
  watchId: string;
  defaultPrice?: number;
  defaultSource?: string;
  defaultUrl?: string;
  onClose: () => void;
}

export default function BuyModal({
  brand,
  model,
  reference,
  watchId,
  defaultPrice,
  defaultSource,
  defaultUrl,
  onClose,
}: BuyModalProps) {
  const router = useRouter();
  const [price, setPrice] = useState(defaultPrice?.toString() || '');
  const [source, setSource] = useState(defaultSource || '');
  const [url, setUrl] = useState(defaultUrl || '');
  const [fees, setFees] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!price) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchId,
          brand,
          model,
          reference,
          purchasePrice: Number(price),
          purchaseDate: new Date(date).toISOString(),
          purchaseSource: source,
          purchaseUrl: url || null,
          fees: fees ? Number(fees) : 0,
          notes,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          router.push('/portfolio');
        }, 1000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#111118] border border-gray-800 rounded-xl w-full max-w-lg p-6 space-y-4">
        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">&#10003;</div>
            <p className="text-green-400 font-semibold text-lg">Added to Portfolio!</p>
            <p className="text-gray-500 text-sm mt-1">Redirecting to portfolio...</p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold text-white">Log Purchase</h2>
              <p className="text-sm text-gray-500">{brand} {model}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Purchase Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Source</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500"
                    placeholder="Chrono24, Watchfinder, etc."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Fees (shipping, tax, etc.)</label>
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

              <div>
                <label className="text-xs text-gray-500 block mb-1">Listing URL (optional)</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500 resize-none"
                  placeholder="Condition, box/papers, etc."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !price}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {submitting ? <SpinnerIcon className="w-4 h-4" /> : null}
                  Add to Portfolio
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
          </>
        )}
      </div>
    </div>
  );
}
