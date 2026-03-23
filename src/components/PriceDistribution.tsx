'use client';

import { formatPrice } from '@/lib/utils';

interface Props {
  prices: number[];
  marketPrice: number;
}

export default function PriceDistribution({ prices, marketPrice }: Props) {
  if (prices.length < 3) {
    return <div className="text-gray-500 text-center py-8 text-sm">Need more listings for distribution chart</div>;
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min || 1;

  // Create bins for histogram
  const binCount = Math.min(12, Math.max(5, Math.ceil(Math.sqrt(prices.length))));
  const binSize = range / binCount;
  const bins: { low: number; high: number; count: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    bins.push({
      low: min + i * binSize,
      high: min + (i + 1) * binSize,
      count: 0,
    });
  }

  for (const price of sorted) {
    const binIndex = Math.min(Math.floor((price - min) / binSize), binCount - 1);
    bins[binIndex].count++;
  }

  const maxCount = Math.max(...bins.map((b) => b.count));
  const marketBinIndex = Math.min(Math.floor((marketPrice - min) / binSize), binCount - 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-32">
        {bins.map((bin, i) => {
          const height = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
          const isMarketBin = i === marketBinIndex;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-[#1a1a24] border border-gray-700 rounded-lg px-2 py-1 text-xs whitespace-nowrap">
                  <div className="text-white">{bin.count} listing{bin.count !== 1 ? 's' : ''}</div>
                  <div className="text-gray-500">{formatPrice(bin.low)} - {formatPrice(bin.high)}</div>
                </div>
              </div>
              <div
                className={`w-full rounded-t transition-all ${
                  isMarketBin
                    ? 'bg-yellow-500/60 border border-yellow-500/40'
                    : bin.count > 0
                    ? 'bg-blue-500/40 hover:bg-blue-500/60'
                    : 'bg-gray-800/30'
                }`}
                style={{ height: `${Math.max(height, bin.count > 0 ? 4 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-2 text-[10px] text-gray-500">
        <span>{formatPrice(min)}</span>
        <span className="text-yellow-400">Market: {formatPrice(marketPrice)}</span>
        <span>{formatPrice(max)}</span>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/40 inline-block" /> Listings</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500/60 inline-block" /> Market Price</span>
      </div>
    </div>
  );
}
