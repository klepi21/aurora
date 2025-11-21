'use client';
import { PropsWithChildren } from 'react';
import { Header } from './Header';
import { usePathname } from 'next/navigation';
import { RouteNamesEnum } from '@/localConstants';

export const Layout = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const isHomePage = pathname === RouteNamesEnum.home;
  const isAdminPage = pathname === '/admin';

  return (
    <div className={`flex min-h-screen flex-col ${isHomePage || isAdminPage ? 'bg-gradient-to-b from-[#0A3124] via-[#0A3124]/80 to-[#0A3124]/60' : 'bg-slate-200'}`}>
      <Header />
      <main className={`flex flex-grow ${isHomePage || isAdminPage ? 'w-full' : 'items-stretch justify-center'}`}>
        {children}
      </main>
    </div>
  );
};
