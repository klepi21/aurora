'use client';
import { AuthRedirectWrapper } from '@/wrappers';
import { Button } from '@/components';
import { RouteNamesEnum } from '@/localConstants';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
export default function Home() {
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [displayPlayers, setDisplayPlayers] = useState<number>(0);
  const [totalPrize] = useState<number>(500);
  const [displayPrize, setDisplayPrize] = useState<number>(0);

  // Fetch total players from database
  useEffect(() => {
    const fetchTotalPlayers = async () => {
      try {
        const response = await fetch('/api/stats');
        const result = await response.json();
        if (result.success) {
          setTotalPlayers(result.data.totalPlayers || 0);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchTotalPlayers();
  }, []);

  // Animate players counter
  useEffect(() => {
    if (totalPlayers === 0) return;
    
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = totalPlayers / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= totalPlayers) {
        setDisplayPlayers(totalPlayers);
        clearInterval(timer);
      } else {
        setDisplayPlayers(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [totalPlayers]);

  // Animate prize counter
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = totalPrize / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= totalPrize) {
        setDisplayPrize(totalPrize);
        clearInterval(timer);
      } else {
        setDisplayPrize(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [totalPrize]);

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <div className='w-full min-h-screen bg-gradient-to-b from-[#0A3124] via-[#0A3124]/80 to-[#0A3124]/60 relative overflow-hidden'>
        {/* Background Decorative Elements */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          {/* Large gradient circles */}
          <div className='absolute -top-40 -left-40 w-96 h-96 bg-[#3EB489]/10 rounded-full blur-3xl'></div>
          <div className='absolute top-1/4 -right-40 w-96 h-96 bg-[#8ED6C1]/10 rounded-full blur-3xl'></div>
          <div className='absolute bottom-1/4 -left-40 w-96 h-96 bg-[#3EB489]/5 rounded-full blur-3xl'></div>
          <div className='absolute -bottom-40 right-1/4 w-96 h-96 bg-[#8ED6C1]/10 rounded-full blur-3xl'></div>
          
          {/* Grid pattern overlay */}
          <div 
            className='absolute inset-0 opacity-[0.03]'
            style={{
              backgroundImage: `
                linear-gradient(to right, #3EB489 1px, transparent 1px),
                linear-gradient(to bottom, #3EB489 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          ></div>
          
          {/* Subtle diagonal lines */}
          <div className='absolute inset-0 opacity-[0.02]'>
            <div 
              className='w-full h-full'
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #3EB489 10px, #3EB489 11px)'
              }}
            ></div>
          </div>
        </div>

        {/* Content wrapper with relative positioning */}
        <div className='relative z-10'>
        {/* Hero Section */}
        <div className='w-full px-6 md:px-12 pt-24 md:pt-32 pb-12 md:py-20 relative overflow-hidden'>
          {/* Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className='absolute inset-0 w-full h-full object-cover opacity-100 z-0'
          >
            <source src='/assets/img/bgvid.mp4' type='video/mp4' />
          </video>
          
          {/* Content Overlay */}
          <div className='relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-2 md:gap-4 items-center'>
            {/* Left Column - Main Content */}
            <div className='flex flex-col gap-8 items-center text-center'>
              <div>
                <h1 className='text-5xl md:text-7xl font-bold text-white mb-4 leading-tight'>
                  Build Your
                  <br />
                  <span className='text-[#3EB489]'>Fantasy Team</span>
                </h1>
                <p className='text-lg md:text-xl text-white/70 max-w-lg mx-auto'>
                  Own NFT players, compete in seasons, and earn rewards. The future of fantasy football is here.
                </p>
              </div>
            </div>

            {/* Right Column - Visual Element */}
            <div className='relative flex items-center justify-center py-8 md:py-12'>
              <div className='relative w-full max-w-md aspect-square'>
                <img
                  src='/assets/img/Layer 1.png'
                  alt='Aurora Football League'
                  className='w-full h-full object-contain scale-x-[-1]'
                />
              </div>
            </div>
          </div>
        </div>


        {/* Features Section */}
        <div className='w-full px-6 md:px-12 py-12 md:py-20 relative overflow-hidden'>
          {/* Background Image */}
          <div className='absolute inset-0 z-0'>
            <img
              src='/assets/img/bg2.png'
              alt='Background'
              className='w-full h-full object-cover opacity-20'
            />
          </div>
          
          {/* Content Overlay */}
          <div className='relative z-10 max-w-7xl mx-auto'>
            <div className='mb-12'>
              <h2 className='text-4xl md:text-5xl font-bold text-white mb-4'>
                Why Choose
                <br />
                <span className='text-[#3EB489]'>Aurora Football?</span>
              </h2>
            </div>

            {/* Mobile Layout */}
            <div className='md:hidden space-y-6'>
              {/* Mobile Image - appears at top */}
              <div className='flex items-center justify-center py-4'>
                <div className='relative w-full aspect-square max-w-[250px] mx-auto'>
                  <img
                    src='/assets/img/Layer 2.png'
                    alt='Aurora Football'
                    className='w-full h-full object-contain'
                  />
                </div>
              </div>

              {/* Feature 01 */}
              <div className='relative bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-6 shadow-2xl border border-gray-800/50 overflow-hidden group hover:border-[#3EB489]/50 transition-all'>
                <div className='absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#3EB489]/20 to-transparent rounded-full blur-3xl'></div>
                <div className='relative z-10'>
                  <div className='text-5xl font-bold text-[#3EB489] mb-3'>01</div>
                  <h3 className='text-lg font-bold text-white mb-2'>True Ownership</h3>
                  <p className='text-white/70 text-sm leading-relaxed'>
                    Full control of your team through NFT ownership. Your players, your assets.
                  </p>
                </div>
              </div>

              {/* Feature 02 */}
              <div className='relative bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-6 shadow-2xl border border-gray-800/50 overflow-hidden group hover:border-[#3EB489]/50 transition-all'>
                <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#3EB489]/20 to-transparent rounded-full blur-3xl'></div>
                <div className='relative z-10'>
                  <div className='text-5xl font-bold text-[#3EB489] mb-3'>02</div>
                  <h3 className='text-lg font-bold text-white mb-2'>Competitive Seasons</h3>
                  <p className='text-white/70 text-sm leading-relaxed'>
                    Compete in 2-month seasons. Earn points, climb leaderboards, win rewards.
                  </p>
                </div>
              </div>

              {/* Feature 03 */}
              <div className='relative bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-6 shadow-2xl border border-gray-800/50 overflow-hidden group hover:border-[#3EB489]/50 transition-all'>
                <div className='absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-[#3EB489]/20 to-transparent rounded-full blur-3xl'></div>
                <div className='relative z-10'>
                  <div className='text-5xl font-bold text-[#3EB489] mb-3'>03</div>
                  <h3 className='text-lg font-bold text-white mb-2'>Strategic Gameplay</h3>
                  <p className='text-white/70 text-sm leading-relaxed'>
                    Build your 5-player team: 1 GK, 2 DEF, 2 ATT. Strategy matters.
                  </p>
                </div>
              </div>

              {/* Feature 04 */}
              <div className='relative bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-6 shadow-2xl border border-gray-800/50 overflow-hidden group hover:border-[#3EB489]/50 transition-all'>
                <div className='absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-[#3EB489]/20 to-transparent rounded-full blur-3xl'></div>
                <div className='relative z-10'>
                  <div className='text-5xl font-bold text-[#3EB489] mb-3'>04</div>
                  <h3 className='text-lg font-bold text-white mb-2'>Earn Rewards</h3>
                  <p className='text-white/70 text-sm leading-relaxed'>
                    Win USDC prizes, rare NFTs, and exclusive rewards based on performance.
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className='hidden md:grid md:grid-cols-3 gap-8 md:gap-12 items-center'>
              {/* Left Column */}
              <div className='space-y-6'>
                {/* Feature 01 */}
                <div className='relative bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-8 shadow-2xl border border-gray-800/50 overflow-hidden group hover:border-[#3EB489]/50 transition-all'>
                  <div className='absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#3EB489]/20 to-transparent rounded-full blur-3xl'></div>
                  <div className='relative z-10'>
                    <div className='text-6xl font-bold text-[#3EB489] mb-4'>01</div>
                    <h3 className='text-xl font-bold text-white mb-3'>True Ownership</h3>
                    <p className='text-white/70 text-base leading-relaxed'>
                      Full control of your team through NFT ownership. Your players, your assets.
                    </p>
                  </div>
                </div>

                {/* Feature 03 */}
                <div className='relative bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-8 shadow-2xl border border-gray-800/50 overflow-hidden group hover:border-[#3EB489]/50 transition-all'>
                  <div className='absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-[#3EB489]/20 to-transparent rounded-full blur-3xl'></div>
                  <div className='relative z-10'>
                    <div className='text-6xl font-bold text-[#3EB489] mb-4'>03</div>
                    <h3 className='text-xl font-bold text-white mb-3'>Strategic Gameplay</h3>
                    <p className='text-white/70 text-base leading-relaxed'>
                      Build your 5-player team: 1 GK, 2 DEF, 2 ATT. Strategy matters.
                    </p>
                  </div>
                </div>
              </div>

              {/* Center Column - Image */}
              <div className='flex items-center justify-center'>
                <div className='relative w-full aspect-square'>
                  <Image
                    src='/assets/img/Layer%202.png'
                    alt='Aurora Football'
                    fill
                    className='object-contain'
                    unoptimized
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className='space-y-6'>
                {/* Feature 02 */}
                <div className='relative bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-8 shadow-2xl border border-gray-800/50 overflow-hidden group hover:border-[#3EB489]/50 transition-all'>
                  <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3EB489]/20 to-transparent rounded-full blur-3xl'></div>
                  <div className='relative z-10'>
                    <div className='text-6xl font-bold text-[#3EB489] mb-4'>02</div>
                    <h3 className='text-xl font-bold text-white mb-3'>Competitive Seasons</h3>
                    <p className='text-white/70 text-base leading-relaxed'>
                      Compete in 2-month seasons. Earn points, climb leaderboards, win rewards.
                    </p>
                  </div>
                </div>

                {/* Feature 04 */}
                <div className='relative bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-8 shadow-2xl border border-gray-800/50 overflow-hidden group hover:border-[#3EB489]/50 transition-all'>
                  <div className='absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3EB489]/20 to-transparent rounded-full blur-3xl'></div>
                  <div className='relative z-10'>
                    <div className='text-6xl font-bold text-[#3EB489] mb-4'>04</div>
                    <h3 className='text-xl font-bold text-white mb-3'>Earn Rewards</h3>
                    <p className='text-white/70 text-base leading-relaxed'>
                      Win USDC prizes, rare NFTs, and exclusive rewards based on performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Stats Section */}
        <div className='w-full px-6 md:px-12 py-12 md:py-20 relative overflow-hidden'>
          {/* Background Image */}
          <div className='absolute inset-0 z-0'>
            <img
              src='/assets/img/bg3.png'
              alt='Background'
              className='w-full h-full object-cover opacity-20'
            />
          </div>
          
          {/* Content Overlay */}
          <div className='relative z-10 max-w-7xl mx-auto'>
            <div className='grid md:grid-cols-2 gap-8'>
              {/* Total Players */}
              <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-800/50 text-center'>
                <div className='mb-4'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='w-12 h-12 text-[#3EB489] mx-auto'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z'
                    />
                  </svg>
                </div>
                <div className='text-5xl md:text-6xl font-bold text-[#3EB489] mb-2 transition-all duration-300'>
                  {displayPlayers.toLocaleString()}
                </div>
                <p className='text-lg md:text-xl text-white/70 font-medium'>
                  Registered Teams
                </p>
              </div>

              {/* Total Prize Pool */}
              <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-800/50 text-center'>
                <div className='mb-4'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='w-12 h-12 text-[#3EB489] mx-auto'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <div className='text-5xl md:text-6xl font-bold text-[#3EB489] mb-2 transition-all duration-300'>
                  ${displayPrize.toLocaleString()}
                </div>
                <p className='text-lg md:text-xl text-white/70 font-medium'>
                  Total Prize Pool
                </p>
                <p className='text-sm text-white/50 mt-2'>USDC</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className='w-full px-6 md:px-12 py-12 md:py-20 relative overflow-hidden'>
          {/* Background Image */}
          <div className='absolute inset-0 z-0'>
            <img
              src='/assets/img/bg4.png'
              alt='Background'
              className='w-full h-full object-cover opacity-20'
            />
          </div>
          
          {/* Content Overlay */}
          <div className='relative z-10'>
            <div className='text-center mb-12'>
              <h2 className='text-4xl md:text-5xl font-bold text-white mb-4'>
                How It <span className='text-[#3EB489]'>Works</span>
              </h2>
              <p className='text-white/70 text-lg max-w-2xl mx-auto'>
                Simple steps to start your fantasy football journey
              </p>
            </div>

            <div className='max-w-7xl mx-auto'>
            <div className='grid md:grid-cols-2 gap-8 md:gap-12 items-center'>
              {/* Left Column - Image */}
              <div className='hidden md:flex items-center justify-center order-2 md:order-1'>
                <div className='relative w-full aspect-square'>
                  <Image
                    src='/assets/img/Layer%203.png'
                    alt='Aurora Football'
                    fill
                    className='object-contain'
                    unoptimized
                  />
                </div>
              </div>

              {/* Right Column - All Steps */}
              <div className='space-y-8 order-1 md:order-2'>
                {/* Step 1 */}
                <div className='text-center'>
                  <div className='w-16 h-16 bg-gradient-to-br from-[#3EB489] to-[#8ED6C1] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#3EB489]/30'>
                    <span className='text-2xl font-bold text-white'>1</span>
                  </div>
                  <h3 className='text-xl font-bold text-white mb-2'>Buy NFT Players</h3>
                  <p className='text-white/70 text-sm'>
                    Purchase player NFTs from the collection
                  </p>
                </div>

                {/* Step 2 */}
                <div className='text-center'>
                  <div className='w-16 h-16 bg-gradient-to-br from-[#3EB489] to-[#8ED6C1] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#3EB489]/30'>
                    <span className='text-2xl font-bold text-white'>2</span>
                  </div>
                  <h3 className='text-xl font-bold text-white mb-2'>Build Your Team</h3>
                  <p className='text-white/70 text-sm'>
                    Select 5 players: 1 GK, 2 DEF, 2 ATT
                  </p>
                </div>

                {/* Step 3 */}
                <div className='text-center'>
                  <div className='w-16 h-16 bg-gradient-to-br from-[#3EB489] to-[#8ED6C1] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#3EB489]/30'>
                    <span className='text-2xl font-bold text-white'>3</span>
                  </div>
                  <h3 className='text-xl font-bold text-white mb-2'>Compete & Win</h3>
                  <p className='text-white/70 text-sm'>
                    Earn points and climb the leaderboard
                  </p>
                </div>
              </div>

              {/* Mobile Image - appears above steps */}
              <div className='md:hidden col-span-2 flex items-center justify-center py-6 order-1'>
                <div className='relative w-full aspect-square max-w-[200px] mx-auto'>
                  <Image
                    src='/assets/img/Layer%203.png'
                    alt='Aurora Football'
                    fill
                    className='object-contain'
                    unoptimized
                  />
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>


        {/* Scoring System */}
        <div className='w-full px-6 md:px-12 py-12 md:py-20'>
          <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-800/50'>
            <h2 className='text-3xl md:text-4xl font-bold text-white mb-8 text-center'>
              Scoring <span className='text-[#3EB489]'>System</span>
            </h2>
            <div className='max-w-7xl mx-auto'>
              <div className='grid md:grid-cols-3 gap-6'>
                {/* GK - Goalkeeper */}
                <div className='bg-gray-800/30 rounded-2xl border border-gray-700/50 p-6'>
                  <h3 className='text-xl font-bold text-[#3EB489] mb-4 text-center'>GK – Goalkeeper</h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between text-white'>
                      <span>Participation:</span>
                      <span className='text-[#3EB489] font-semibold'>+1</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Goal:</span>
                      <span className='text-[#3EB489] font-semibold'>+20</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Assist:</span>
                      <span className='text-[#3EB489] font-semibold'>+2</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Yellow card:</span>
                      <span className='text-red-400 font-semibold'>–1</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Red card:</span>
                      <span className='text-red-400 font-semibold'>–3</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Clean sheet:</span>
                      <span className='text-[#3EB489] font-semibold'>+3</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Penalty save:</span>
                      <span className='text-[#3EB489] font-semibold'>+2</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Win + clean sheet:</span>
                      <span className='text-[#3EB489] font-semibold'>+1</span>
                    </div>
                  </div>
                </div>

                {/* DEF - Defender */}
                <div className='bg-gray-800/30 rounded-2xl border border-gray-700/50 p-6'>
                  <h3 className='text-xl font-bold text-[#3EB489] mb-4 text-center'>DEF – Defender</h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between text-white'>
                      <span>Participation:</span>
                      <span className='text-[#3EB489] font-semibold'>+1</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Goal:</span>
                      <span className='text-[#3EB489] font-semibold'>+4</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Assist:</span>
                      <span className='text-[#3EB489] font-semibold'>+2</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Yellow card:</span>
                      <span className='text-red-400 font-semibold'>–1</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Red card:</span>
                      <span className='text-red-400 font-semibold'>–3</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Clean sheet:</span>
                      <span className='text-[#3EB489] font-semibold'>+2</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Penalty save:</span>
                      <span className='text-white/40'>—</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Win + clean sheet:</span>
                      <span className='text-[#3EB489] font-semibold'>+1</span>
                    </div>
                  </div>
                </div>

                {/* FWD - Forward */}
                <div className='bg-gray-800/30 rounded-2xl border border-gray-700/50 p-6'>
                  <h3 className='text-xl font-bold text-[#3EB489] mb-4 text-center'>FWD – Forward</h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between text-white'>
                      <span>Participation:</span>
                      <span className='text-[#3EB489] font-semibold'>+1</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Goal:</span>
                      <span className='text-[#3EB489] font-semibold'>+3</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Assist:</span>
                      <span className='text-[#3EB489] font-semibold'>+2</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Yellow card:</span>
                      <span className='text-red-400 font-semibold'>–1</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Red card:</span>
                      <span className='text-red-400 font-semibold'>–3</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Clean sheet:</span>
                      <span className='text-white/40'>—</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Penalty save:</span>
                      <span className='text-white/40'>—</span>
                    </div>
                    <div className='flex justify-between text-white'>
                      <span>Win + clean sheet:</span>
                      <span className='text-white/40'>—</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* CTA Section */}
        <div className='w-full px-6 md:px-12 py-20'>
          <div className='max-w-7xl mx-auto'>
            <div className='bg-gradient-to-r from-[#3EB489]/20 to-[#8ED6C1]/20 rounded-3xl p-12 md:p-16 text-center border border-[#3EB489]/30'>
            <h2 className='text-4xl md:text-5xl font-bold text-white mb-4'>
              Ready to Start?
            </h2>
            <p className='text-white/70 text-lg mb-8 max-w-2xl mx-auto'>
              Join Aurora Football League and build your fantasy team today
            </p>
            <Link href={RouteNamesEnum.app}>
              <Button className='px-8 py-4 text-lg bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-white rounded-xl shadow-lg'>
                Launch App
              </Button>
            </Link>
            </div>
          </div>
        </div>


        {/* Footer */}
        <footer className='w-full border-t border-gray-800/50 py-8'>
          <div className='w-full px-6 md:px-12'>
            <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
              <div className='text-white/60 text-sm'>
                © 2024 Aurora Football League. All rights reserved.
              </div>
              <div className='flex gap-6'>
                <Link href={RouteNamesEnum.app} className='text-white/60 hover:text-white text-sm transition-colors'>
                  Home
                </Link>
                <Link href={RouteNamesEnum.app + '/leaderboard'} className='text-white/60 hover:text-white text-sm transition-colors'>
                  Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </footer>
        </div>
      </div>
    </AuthRedirectWrapper>
  );
}
