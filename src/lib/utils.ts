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
