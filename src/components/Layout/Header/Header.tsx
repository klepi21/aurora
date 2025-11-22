'use client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button, MxLink } from '@/components';
import { environment } from '@/config';
import { useGetIsLoggedIn } from '@/lib';
import { RouteNamesEnum } from '@/localConstants';
import mvxLogo from '../../../../public/assets/img/multiversx-logo.svg';
import Image from 'next/image';
import { GitHubButton, NotificationsButton } from './components';

export const Header = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === RouteNamesEnum.home;

  const onClick = async () => {
    router.push(RouteNamesEnum.logout);
  };

  return (
    <header className={`${isHomePage ? 'fixed top-0 left-0 right-0 z-50' : 'relative'} w-full ${isHomePage ? 'bg-white/10 backdrop-blur-md border-b border-white/20 rounded-b-2xl' : 'bg-white'} py-2 md:py-6 ${isHomePage ? 'shadow-lg shadow-black/20' : 'shadow-md'}`}>
      <div className='max-w-7xl mx-auto px-6 md:px-12'>
        <div className='flex items-center justify-between'>
          {/* Left Navigation */}
          <div className='flex items-center gap-4 flex-1'>
            {isHomePage && (
              <a
                href='https://t.me/aflmvx'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors'
                aria-label='Join our Telegram'
              >
                <svg
                  className='w-6 h-6 text-white'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'/>
                </svg>
              </a>
            )}
            {!isHomePage && (
              <>
          <div className='flex gap-1 items-center'>
            <div className='w-2 h-2 rounded-full bg-green-500' />
                  <p className='text-gray-600 text-sm'>{environment}</p>
                </div>
                <GitHubButton />
              </>
            )}
          </div>

          {/* Centered Logo */}
          <div className='flex-1 flex justify-center'>
            <MxLink
              className='flex items-center justify-center'
              to={isLoggedIn ? RouteNamesEnum.app : RouteNamesEnum.home}
            >
              <img src='/assets/img/logoafl.png' alt='Aurora Football League' className={`${isHomePage ? 'h-12 md:h-16' : 'h-8 md:h-10'} w-auto`} />
            </MxLink>
          </div>

          {/* Right Navigation */}
          <div className='flex items-center gap-4 flex-1 justify-end'>
            {!isHomePage && isLoggedIn && (
            <>
              <NotificationsButton />
              <Button
                onClick={onClick}
                className='inline-block rounded-lg px-3 py-2 text-center hover:no-underline my-0 text-gray-600 hover:bg-slate-100 mx-0'
              >
                Close
              </Button>
            </>
          )}

            {isHomePage && (
              <Link href={RouteNamesEnum.app}>
                <Button className='px-3 py-1.5 md:px-6 md:py-3 text-xs md:text-sm font-semibold bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-gray-900 rounded-xl shadow-lg'>
                  Launch App
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
