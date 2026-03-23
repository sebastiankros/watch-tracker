export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPct(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export function discountColor(pct: number): string {
  if (pct >= 15) return 'text-green-400';
  if (pct >= 10) return 'text-yellow-400';
  if (pct >= 5) return 'text-orange-400';
  return 'text-gray-400';
}

export function discountBg(pct: number): string {
  if (pct >= 15) return 'bg-green-500/10 border-green-500/30';
  if (pct >= 10) return 'bg-yellow-500/10 border-yellow-500/30';
  if (pct >= 5) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-gray-500/10 border-gray-500/30';
}

export function trendIcon(current: number, previous: number | null): string {
  if (!previous) return '→';
  if (current > previous * 1.01) return '↑';
  if (current < previous * 0.99) return '↓';
  return '→';
}

export function trendColor(current: number, previous: number | null): string {
  if (!previous) return 'text-gray-400';
  if (current > previous * 1.01) return 'text-green-400';
  if (current < previous * 0.99) return 'text-red-400';
  return 'text-gray-400';
}

export function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function badgeLabel(badge: string | null): string {
  switch (badge) {
    case 'hot': return 'HOT DEAL';
    case 'great': return 'GREAT';
    case 'best-value': return 'BEST VALUE';
    case 'good': return 'GOOD';
    default: return '';
  }
}

export function badgeStyle(badge: string | null): string {
  switch (badge) {
    case 'hot': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'great': return 'bg-green-500/15 text-green-400 border-green-500/30';
    case 'best-value': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'good': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    default: return '';
  }
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  if (score >= 25) return 'text-orange-400';
  return 'text-gray-400';
}

export function formatDealForSharing(deal: {
  brand: string;
  model: string;
  listingPrice: number;
  marketPrice: number;
  discount: number;
  savings: number;
  source: string;
  url: string;
}): string {
  return [
    `${deal.brand} ${deal.model}`,
    `${formatPrice(deal.listingPrice)} (${formatPrice(deal.savings)} below market)`,
    `Market: ${formatPrice(deal.marketPrice)} | -${deal.discount}%`,
    `Source: ${deal.source}`,
    deal.url,
  ].join('\n');
}
