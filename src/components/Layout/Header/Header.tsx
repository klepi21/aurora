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
    <header className={`relative w-full ${isHomePage ? 'bg-transparent' : 'bg-white'} py-4 md:py-6 ${isHomePage ? 'shadow-lg shadow-black/20' : 'shadow-md'}`}>
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
              {isHomePage ? (
                <div className='text-2xl md:text-3xl font-bold'>
                  <span className='text-white'>Aurora</span>
                  <span className='text-[#3EB489]'> Football</span>
                </div>
              ) : (
                <Image src={mvxLogo} alt='logo' className='h-6' />
              )}
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
                <Button className='px-6 py-3 text-sm font-semibold bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-white rounded-xl shadow-lg'>
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
