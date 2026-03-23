export default function PriceBar({
  listingPrice,
  marketPrice,
  lowPrice,
  highPrice,
}: {
  listingPrice: number;
  marketPrice: number;
  lowPrice?: number;
  highPrice?: number;
}) {
  const min = lowPrice ?? marketPrice * 0.7;
  const max = highPrice ?? marketPrice * 1.3;
  const range = max - min || 1;

  const listingPct = Math.max(0, Math.min(100, ((listingPrice - min) / range) * 100));
  const marketPct = Math.max(0, Math.min(100, ((marketPrice - min) / range) * 100));

  return (
    <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
      {/* Listing price position */}
      <div
        className="absolute top-0 h-full bg-green-500 rounded-full price-bar-fill"
        style={{ width: `${listingPct}%` }}
      />
      {/* Market price marker */}
      <div
        className="absolute top-0 h-full w-0.5 bg-yellow-400"
        style={{ left: `${marketPct}%` }}
        title={`Market: $${marketPrice.toLocaleString()}`}
      />
    </div>
  );
}
