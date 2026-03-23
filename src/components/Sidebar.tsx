'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardIcon, DealsIcon, MarketIcon, AlertIcon, SettingsIcon, LogoutIcon, WatchIcon, SearchIcon, PortfolioIcon } from './Icons';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', Icon: DashboardIcon },
  { href: '/search', label: 'Search', Icon: SearchIcon, badge: 'LIVE' },
  { href: '/deals', label: 'Deals', Icon: DealsIcon },
  { href: '/market', label: 'Market Prices', Icon: MarketIcon },
  { href: '/portfolio', label: 'Portfolio', Icon: PortfolioIcon, badge: 'NEW' },
  { href: '/alerts', label: 'Alerts', Icon: AlertIcon },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <aside className="w-64 bg-[#111118] border-r border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-20">
      <div className="p-5 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <WatchIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Second Mark</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Watch Co.</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.Icon className="w-5 h-5" />
              {item.label}
              {item.badge && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  item.badge === 'NEW' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition"
        >
          <LogoutIcon className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
