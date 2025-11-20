'use client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button, MxLink } from '@/components';
import { environment } from '@/config';
import { useGetIsLoggedIn } from '@/lib';
import { RouteNamesEnum } from '@/localConstants';
import mvxLogo from '../../../../public/assets/img/multiversx-logo.svg';
import logoAFL from '../../../../public/assets/img/logoafl.png';
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
              <Image src={logoAFL} alt='Aurora Football League' className={`${isHomePage ? 'h-12 md:h-16' : 'h-8 md:h-10'} w-auto`} unoptimized />
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
