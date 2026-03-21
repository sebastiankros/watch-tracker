'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // No shell on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <div className="p-4 lg:p-6 max-w-[1600px]">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
