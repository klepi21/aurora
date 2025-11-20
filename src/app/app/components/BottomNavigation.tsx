'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RouteNamesEnum } from '@/localConstants';
import { getAccountProvider } from '@/lib';
import homeIcon from '../../../../public/assets/img/home.png';
import myTeamIcon from '../../../../public/assets/img/myteam.png';
import leaderboardIcon from '../../../../public/assets/img/leaderboard.png';
import disconnectIcon from '../../../../public/assets/img/dissconnect.png';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  isAction?: boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    path: RouteNamesEnum.app,
    icon: (
      <Image
        src={homeIcon}
        alt='Home'
        width={32}
        height={32}
        className='w-8 h-8'
      />
    )
  },
  {
    label: 'my team',
    path: `${RouteNamesEnum.app}/squads`,
    icon: (
      <Image
        src={myTeamIcon}
        alt='My Team'
        width={32}
        height={32}
        className='w-8 h-8'
      />
    )
  },
  {
    label: 'Leaderboard',
    path: `${RouteNamesEnum.app}/leaderboard`,
    icon: (
      <Image
        src={leaderboardIcon}
        alt='Leaderboard'
        width={32}
        height={32}
        className='w-8 h-8'
      />
    )
  },
  {
    label: 'Shop',
    path: `${RouteNamesEnum.app}/shop`,
    icon: (
      <svg
        width='32'
        height='32'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='w-8 h-8'
      >
        <path
          d='M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4H20C20.5523 4 21 4.44772 21 5C21 5.55228 20.5523 6 20 6H19V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V6H4C3.44772 6 3 5.55228 3 5C3 4.44772 3.44772 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z'
          fill='currentColor'
        />
        <path
          d='M9 9V17H11V9H9Z'
          fill='currentColor'
        />
        <path
          d='M13 9V17H15V9H13Z'
          fill='currentColor'
        />
      </svg>
    )
  },
  {
    label: 'Disconnect',
    path: '#',
    isAction: true,
    icon: (
      <Image
        src={disconnectIcon}
        alt='Disconnect'
        width={32}
        height={32}
        className='w-8 h-8'
      />
    )
  }
];

export const BottomNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleDisconnect = async () => {
    try {
      const provider = getAccountProvider();
      await provider.logout();
      router.push(RouteNamesEnum.home);
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  return (
    <nav className='absolute bottom-0 left-0 right-0 bg-gradient-to-br from-gray-900/95 to-black rounded-t-[2rem] shadow-2xl z-50 border-t border-gray-800/50'>
      <div className='flex items-center justify-around py-4 px-2'>
        {navItems.map((item) => {
          const isActive =
            !item.isAction &&
            (pathname === item.path ||
              (item.path === RouteNamesEnum.app && pathname === RouteNamesEnum.app));

          if (item.isAction) {
            return (
              <button
                key={item.label}
                onClick={handleDisconnect}
                className='relative flex flex-col items-center justify-center gap-1 py-1 px-3 min-w-[60px] transition-colors hover:opacity-80 active:scale-95'
              >
                <div className='flex items-center justify-center transition-opacity opacity-70'>
                  {item.icon}
                </div>
                <span className='text-xs font-medium text-white/70'>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              className='relative flex flex-col items-center justify-center gap-1 py-1 px-3 min-w-[60px]'
            >
              {isActive && (
                <div className='absolute -top-2 left-1/2 transform -translate-x-1/2'>
                  <svg
                    width='16'
                    height='8'
                    viewBox='0 0 16 8'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M0 8L8 0L16 8H0Z'
                      fill='white'
                    />
                  </svg>
                </div>
              )}
              <div className='flex items-center justify-center transition-opacity'>
                <div className={isActive ? 'opacity-100' : 'opacity-70'}>
                  {item.icon}
                </div>
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-white' : 'text-white/70'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

