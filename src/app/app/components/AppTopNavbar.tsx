'use client';
import Image from 'next/image';
import logoAFL from '../../../../public/assets/img/logoafl.png';

export const AppTopNavbar = () => {
  return (
    <nav className='w-full bg-gradient-to-br from-gray-900/95 to-black border-b border-gray-800/50'>
      <div className='flex items-center justify-center py-5'>
        <Image src={logoAFL} alt='Aurora Football League' className='h-8 md:h-10 w-auto' unoptimized />
      </div>
    </nav>
  );
};

