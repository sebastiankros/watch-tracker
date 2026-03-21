'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/deals', label: 'Deals', icon: '🔥' },
  { href: '/market', label: 'Market Prices', icon: '📈' },
  { href: '/alerts', label: 'Alerts', icon: '🔔' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
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
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⌚</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Watch Tracker</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Price Intelligence</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
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
              <span className="text-base">{item.icon}</span>
              {item.label}
              {item.label === 'Deals' && (
                <span className="ml-auto bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  LIVE
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
          <span>🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
