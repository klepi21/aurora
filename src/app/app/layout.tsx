'use client';
import { PropsWithChildren } from 'react';
import { AppTopNavbar, BottomNavigation } from './components';
import { useGetIsLoggedIn } from '@/lib';
import { ConnectButton } from '@/components/Layout/Header/components';
import { ToastProvider } from '@/components/Toast';

export default function AppLayout({ children }: PropsWithChildren) {
  const isLoggedIn = useGetIsLoggedIn();

  return (
    <ToastProvider>
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0A3124] to-black py-0 px-0 md:py-4 md:px-4'>
        <div className='flex flex-col w-full h-screen md:max-w-[428px] md:min-h-[calc(100vh-2rem)] md:h-auto bg-white md:rounded-[2rem] md:shadow-2xl overflow-hidden relative'>
          <AppTopNavbar />
          <main className='flex-1 pb-20 pt-4 px-4 overflow-y-auto bg-gradient-to-b from-[#0A3124]/95 to-black'>
            {!isLoggedIn ? (
              <div className='flex flex-col items-center justify-center h-full min-h-[400px] gap-6 px-4'>
                {/* Image */}
                <div className='relative w-full max-w-[200px] aspect-square mb-4'>
                  <img
                    src='/assets/img/Layer-3.png'
                    alt='Aurora Football'
                    className='w-full h-full object-contain'
                    loading='lazy'
                  />
                </div>
                
                {/* Message */}
                <div className='text-center space-y-3'>
                  <h2 className='text-2xl md:text-3xl font-bold text-white'>
                    ⚽ You're Not on the Pitch Yet!
                  </h2>
                  <p className='text-white/80 text-base md:text-lg max-w-md mx-auto leading-relaxed'>
                    Connect your wallet to join Aurora Football League and start building your fantasy team. The match is waiting for you!
                  </p>
                  <p className='text-[#3EB489] text-sm font-medium mt-2'>
                    🏆 Time to show what you're made of!
                  </p>
                </div>
                
                {/* Connect Button */}
                <div className='mt-4'>
                  <ConnectButton />
                </div>
              </div>
            ) : (
              children
            )}
          </main>
          <BottomNavigation />
        </div>
      </div>
    </ToastProvider>
  );
}

