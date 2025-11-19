'use client';
import { PropsWithChildren } from 'react';
import { AppTopNavbar, BottomNavigation } from './components';
import { useGetIsLoggedIn } from '@/lib';
import { ConnectButton } from '@/components/Layout/Header/components';

export default function AppLayout({ children }: PropsWithChildren) {
  const isLoggedIn = useGetIsLoggedIn();

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0A3124] to-black py-0 px-0 md:py-4 md:px-4'>
      <div className='flex flex-col w-full h-screen md:max-w-[428px] md:min-h-[calc(100vh-2rem)] md:h-auto bg-white md:rounded-[2rem] md:shadow-2xl overflow-hidden relative'>
        <AppTopNavbar />
        <main className='flex-1 pb-20 pt-4 px-4 overflow-y-auto bg-gradient-to-b from-[#0A3124]/95 to-black'>
          {!isLoggedIn ? (
            <div className='flex flex-col items-center justify-center h-full min-h-[400px] gap-4'>
              <p className='text-white text-center mb-4'>
                Please connect your wallet to continue
              </p>
              <ConnectButton />
            </div>
          ) : (
            children
          )}
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}

