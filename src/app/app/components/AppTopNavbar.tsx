'use client';
import { useRouter } from 'next/navigation';
import { getAccountProvider } from '@/lib';
import { RouteNamesEnum } from '@/localConstants';
import Image from 'next/image';
import disconnectIcon from '../../../../public/assets/img/dissconnect.png';

export const AppTopNavbar = () => {
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
    <nav className='w-full bg-gradient-to-br from-gray-900/95 to-black border-b border-gray-800/50'>
      <div className='flex items-center justify-between px-4 py-5'>
        <div className='flex-1'></div>
        <div className='flex-1 flex justify-center'>
          <img src='/assets/img/logoafl.png' alt='Aurora Football League' className='h-8 md:h-10 w-auto' />
        </div>
        <div className='flex-1 flex justify-end'>
          <button
            onClick={handleDisconnect}
            className='flex items-center justify-center px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors'
            title='Exit'
          >
            <Image
              src={disconnectIcon}
              alt='Exit'
              width={24}
              height={24}
              className='w-8 h-8 opacity-70 hover:opacity-100'
            />
          </button>
        </div>
      </div>
    </nav>
  );
};

