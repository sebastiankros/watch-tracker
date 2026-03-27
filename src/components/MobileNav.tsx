'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardIcon, DealsIcon, MarketIcon, SearchIcon, MarketingIcon } from './Icons';

const NAV_ITEMS = [
  { href: '/', label: 'Home', Icon: DashboardIcon },
  { href: '/search', label: 'Search', Icon: SearchIcon },
  { href: '/deals', label: 'Deals', Icon: DealsIcon },
  { href: '/market', label: 'Market', Icon: MarketIcon },
  { href: '/marketing', label: 'Marketing', Icon: MarketingIcon },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#111118] border-t border-gray-800 z-30 px-2 py-1">
      <div className="flex justify-around">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 text-[10px] ${
                active ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              <item.Icon className="w-5 h-5 mb-0.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
