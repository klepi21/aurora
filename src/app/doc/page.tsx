'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RouteNamesEnum } from '@/localConstants';

interface DocSection {
  id: string;
  title: string;
  emoji: string;
  content: React.ReactNode;
}

const docSections: DocSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    emoji: '⚽',
    content: (
      <div className='space-y-4'>
        <p className='text-lg text-gray-300 leading-relaxed'>
          Welcome to <span className='font-bold text-[#3EB489]'>Aurora Football League</span>, the premier fantasy football NFT game on the MultiversX blockchain! 🏆
        </p>
        <p className='text-gray-300 leading-relaxed'>
          Aurora Football League combines the excitement of fantasy football with the power of blockchain technology, allowing you to own, trade, and compete with unique NFT player cards.
        </p>
        <div className='bg-[#3EB489]/10 border border-[#3EB489]/30 rounded-lg p-4 mt-6'>
          <p className='text-[#3EB489] font-semibold mb-2'>🎯 Quick Start</p>
          <p className='text-gray-300 text-sm'>
            Build your team of 5 players (1 GK, 2 DEF, 2 ATT), compete in seasons, and earn rewards!
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'game-overview',
    title: 'Game Overview',
    emoji: '🎮',
    content: (
      <div className='space-y-6'>
        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Core Gameplay</h3>
        <p className='text-gray-300 leading-relaxed'>
          Aurora Football League is a fantasy football game where players build teams using NFT player cards. Each team consists of:
        </p>
        <ul className='list-disc list-inside space-y-2 text-gray-300 ml-4'>
          <li><strong className='text-white'>1 Goalkeeper (GK)</strong> 🥅</li>
          <li><strong className='text-white'>2 Defenders (DEF)</strong> 🛡️</li>
          <li><strong className='text-white'>2 Attackers (ATT)</strong> ⚽</li>
        </ul>
        <p className='text-gray-300 leading-relaxed mt-4'>
          <strong className='text-white'>Total: 5 players per team</strong>
        </p>

        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Player Pool</h3>
        <div className='grid md:grid-cols-3 gap-4 mt-4'>
          <div className='bg-gray-800/50 rounded-lg p-4 border border-gray-700/50'>
            <p className='text-2xl mb-2'>🥅</p>
            <p className='text-white font-semibold'>Goalkeepers</p>
            <p className='text-gray-400 text-sm mt-1'>Limited supply</p>
          </div>
          <div className='bg-gray-800/50 rounded-lg p-4 border border-gray-700/50'>
            <p className='text-2xl mb-2'>🛡️</p>
            <p className='text-white font-semibold'>Defenders</p>
            <p className='text-gray-400 text-sm mt-1'>Strategic choices</p>
          </div>
          <div className='bg-gray-800/50 rounded-lg p-4 border border-gray-700/50'>
            <p className='text-2xl mb-2'>⚽</p>
            <p className='text-white font-semibold'>Attackers</p>
            <p className='text-gray-400 text-sm mt-1'>High scoring potential</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'scoring-system',
    title: 'Scoring System',
    emoji: '📊',
    content: (
      <div className='space-y-6'>
        <p className='text-gray-300 leading-relaxed'>
          Points are awarded based on player performance. Here's how each position earns points:
        </p>

        <div className='space-y-4 mt-6'>
          <div className='bg-gray-800/50 rounded-lg p-6 border border-gray-700/50'>
            <h4 className='text-xl font-bold text-white mb-4 flex items-center gap-2'>
              🥅 Goalkeeper (GK)
            </h4>
            <div className='grid md:grid-cols-2 gap-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Participation</span>
                <span className='text-[#3EB489] font-semibold'>+1</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Goal</span>
                <span className='text-[#3EB489] font-semibold'>+20</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Assist</span>
                <span className='text-[#3EB489] font-semibold'>+2</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Yellow Card</span>
                <span className='text-red-400 font-semibold'>-1</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Red Card</span>
                <span className='text-red-400 font-semibold'>-3</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Clean Sheet</span>
                <span className='text-[#3EB489] font-semibold'>+3</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Penalty Save</span>
                <span className='text-[#3EB489] font-semibold'>+2</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Win + Clean Sheet</span>
                <span className='text-[#3EB489] font-semibold'>+1</span>
              </div>
            </div>
          </div>

          <div className='bg-gray-800/50 rounded-lg p-6 border border-gray-700/50'>
            <h4 className='text-xl font-bold text-white mb-4 flex items-center gap-2'>
              🛡️ Defender (DEF)
            </h4>
            <div className='grid md:grid-cols-2 gap-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Participation</span>
                <span className='text-[#3EB489] font-semibold'>+1</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Goal</span>
                <span className='text-[#3EB489] font-semibold'>+4</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Assist</span>
                <span className='text-[#3EB489] font-semibold'>+2</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Yellow Card</span>
                <span className='text-red-400 font-semibold'>-1</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Red Card</span>
                <span className='text-red-400 font-semibold'>-3</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Clean Sheet</span>
                <span className='text-[#3EB489] font-semibold'>+2</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Penalty Save</span>
                <span className='text-gray-500'>—</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Win + Clean Sheet</span>
                <span className='text-[#3EB489] font-semibold'>+1</span>
              </div>
            </div>
          </div>

          <div className='bg-gray-800/50 rounded-lg p-6 border border-gray-700/50'>
            <h4 className='text-xl font-bold text-white mb-4 flex items-center gap-2'>
              ⚽ Forward (FWD)
            </h4>
            <div className='grid md:grid-cols-2 gap-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Participation</span>
                <span className='text-[#3EB489] font-semibold'>+1</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Goal</span>
                <span className='text-[#3EB489] font-semibold'>+3</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Assist</span>
                <span className='text-[#3EB489] font-semibold'>+2</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Yellow Card</span>
                <span className='text-red-400 font-semibold'>-1</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Red Card</span>
                <span className='text-red-400 font-semibold'>-3</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Clean Sheet</span>
                <span className='text-gray-500'>—</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Penalty Save</span>
                <span className='text-gray-500'>—</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Win + Clean Sheet</span>
                <span className='text-gray-500'>—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'seasons',
    title: 'Seasons & Competition',
    emoji: '🏆',
    content: (
      <div className='space-y-6'>
        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Season Format</h3>
        <p className='text-gray-300 leading-relaxed'>
          Aurora Football League operates on a <strong className='text-white'>2-month season</strong> cycle. At the end of each season:
        </p>
        <ul className='list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4'>
          <li>🏅 Rewards are distributed to top performers</li>
          <li>📊 Rankings are reset for the next season</li>
          <li>🔄 Teams can make adjustments (1 player swap per season)</li>
        </ul>

        <div className='bg-[#3EB489]/10 border border-[#3EB489]/30 rounded-lg p-6 mt-6'>
          <h4 className='text-xl font-bold text-[#3EB489] mb-3'>Season 1 Dates</h4>
          <p className='text-white text-lg font-semibold'>29/11 to 4/1 2026</p>
          <p className='text-gray-300 text-sm mt-2'>Get ready to compete! ⚽</p>
        </div>

        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Team Adjustments</h3>
        <p className='text-gray-300 leading-relaxed'>
          During each season, you can make <strong className='text-white'>1 player swap</strong> at a cost. This allows you to:
        </p>
        <ul className='list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4'>
          <li>Replace underperforming players</li>
          <li>Adapt to changing game conditions</li>
          <li>Optimize your team strategy</li>
        </ul>
      </div>
    )
  },
  {
    id: 'rewards',
    title: 'Rewards & Prizes',
    emoji: '💰',
    content: (
      <div className='space-y-6'>
        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Prize Pool</h3>
        <p className='text-gray-300 leading-relaxed'>
          Compete for amazing rewards! Top performers receive:
        </p>
        <div className='grid md:grid-cols-3 gap-4 mt-6'>
          <div className='bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg p-6 border border-yellow-500/30'>
            <p className='text-3xl mb-2'>💵</p>
            <p className='text-white font-bold text-lg'>USDC Payouts</p>
            <p className='text-gray-300 text-sm mt-2'>Real money prizes</p>
          </div>
          <div className='bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-6 border border-purple-500/30'>
            <p className='text-3xl mb-2'>🎴</p>
            <p className='text-white font-bold text-lg'>Rare NFTs</p>
            <p className='text-gray-300 text-sm mt-2'>Exclusive player cards</p>
          </div>
          <div className='bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-6 border border-blue-500/30'>
            <p className='text-3xl mb-2'>🏅</p>
            <p className='text-white font-bold text-lg'>Leaderboard Tiers</p>
            <p className='text-gray-300 text-sm mt-2'>Bronze, Silver, Gold, Champion</p>
          </div>
        </div>

        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Leaderboard Rankings</h3>
        <div className='space-y-3'>
          <div className='flex items-center gap-3 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50'>
            <span className='text-2xl'>🥇</span>
            <div>
              <p className='text-white font-semibold'>Champion Tier</p>
              <p className='text-gray-400 text-sm'>Top performers receive the highest rewards</p>
            </div>
          </div>
          <div className='flex items-center gap-3 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50'>
            <span className='text-2xl'>🥈</span>
            <div>
              <p className='text-white font-semibold'>Gold Tier</p>
              <p className='text-gray-400 text-sm'>Excellent rewards for top players</p>
            </div>
          </div>
          <div className='flex items-center gap-3 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50'>
            <span className='text-2xl'>🥉</span>
            <div>
              <p className='text-white font-semibold'>Silver & Bronze</p>
              <p className='text-gray-400 text-sm'>Rewards for consistent performers</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'nft-utility',
    title: 'NFT Utility',
    emoji: '🎴',
    content: (
      <div className='space-y-6'>
        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>NFT Features</h3>
        <p className='text-gray-300 leading-relaxed'>
          Your NFT player cards are more than just collectibles. They offer:
        </p>

        <div className='space-y-4 mt-6'>
          <div className='bg-gray-800/50 rounded-lg p-5 border border-gray-700/50'>
            <h4 className='text-lg font-bold text-white mb-2 flex items-center gap-2'>
              ⭐ Rarity System
            </h4>
            <p className='text-gray-300 text-sm'>
              Cards come in different rarities: Common, Rare, Epic, and Legendary. Higher rarity means better stats and multipliers!
            </p>
          </div>

          <div className='bg-gray-800/50 rounded-lg p-5 border border-gray-700/50'>
            <h4 className='text-lg font-bold text-white mb-2 flex items-center gap-2'>
              📈 Stat Multipliers
            </h4>
            <p className='text-gray-300 text-sm'>
              Rare cards can have stat multipliers (e.g., +5% points), giving you an edge in competitions.
            </p>
          </div>

          <div className='bg-gray-800/50 rounded-lg p-5 border border-gray-700/50'>
            <h4 className='text-lg font-bold text-white mb-2 flex items-center gap-2'>
              🔄 Seasonal Upgrades
            </h4>
            <p className='text-gray-300 text-sm'>
              Upgrade your NFTs between seasons to improve their performance and value.
            </p>
          </div>

          <div className='bg-gray-800/50 rounded-lg p-5 border border-gray-700/50'>
            <h4 className='text-lg font-bold text-white mb-2 flex items-center gap-2'>
              💎 Limited Supply
            </h4>
            <p className='text-gray-300 text-sm'>
              Limited NFT supply maintains rarity and value. Own unique players that others can't get!
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    emoji: '🚀',
    content: (
      <div className='space-y-6'>
        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Step-by-Step Guide</h3>

        <div className='space-y-4'>
          <div className='flex gap-4'>
            <div className='flex-shrink-0 w-10 h-10 rounded-full bg-[#3EB489] flex items-center justify-center text-white font-bold'>
              1
            </div>
            <div className='flex-1'>
              <h4 className='text-lg font-bold text-white mb-2'>Connect Your Wallet</h4>
              <p className='text-gray-300 text-sm'>
                Connect your MultiversX wallet to access Aurora Football League. Make sure you have EGLD for transactions.
              </p>
            </div>
          </div>

          <div className='flex gap-4'>
            <div className='flex-shrink-0 w-10 h-10 rounded-full bg-[#3EB489] flex items-center justify-center text-white font-bold'>
              2
            </div>
            <div className='flex-1'>
              <h4 className='text-lg font-bold text-white mb-2'>Create Your Team Name</h4>
              <p className='text-gray-300 text-sm'>
                Choose a unique name for your team. This will be displayed on the leaderboard and in competitions.
              </p>
            </div>
          </div>

          <div className='flex gap-4'>
            <div className='flex-shrink-0 w-10 h-10 rounded-full bg-[#3EB489] flex items-center justify-center text-white font-bold'>
              3
            </div>
            <div className='flex-1'>
              <h4 className='text-lg font-bold text-white mb-2'>Purchase Player NFTs</h4>
              <p className='text-gray-300 text-sm'>
                Visit the Transfer Hub to buy player NFTs. You need 1 GK, 2 DEF, and 2 ATT to complete your team.
              </p>
            </div>
          </div>

          <div className='flex gap-4'>
            <div className='flex-shrink-0 w-10 h-10 rounded-full bg-[#3EB489] flex items-center justify-center text-white font-bold'>
              4
            </div>
            <div className='flex-1'>
              <h4 className='text-lg font-bold text-white mb-2'>Build Your Squad</h4>
              <p className='text-gray-300 text-sm'>
                Select your 5 players and submit your team. Once submitted, you'll start earning points based on their performance!
              </p>
            </div>
          </div>

          <div className='flex gap-4'>
            <div className='flex-shrink-0 w-10 h-10 rounded-full bg-[#3EB489] flex items-center justify-center text-white font-bold'>
              5
            </div>
            <div className='flex-1'>
              <h4 className='text-lg font-bold text-white mb-2'>Compete & Earn</h4>
              <p className='text-gray-300 text-sm'>
                Watch your team climb the leaderboard, earn points, and compete for rewards. Make transfers to optimize your strategy!
              </p>
            </div>
          </div>
        </div>

        <div className='bg-[#3EB489]/10 border border-[#3EB489]/30 rounded-lg p-6 mt-8'>
          <h4 className='text-xl font-bold text-[#3EB489] mb-3'>💡 Pro Tips</h4>
          <ul className='space-y-2 text-gray-300 text-sm'>
            <li>• Balance your team across all positions for consistent scoring</li>
            <li>• Monitor player performance and make strategic transfers</li>
            <li>• Join early to get the best NFT deals</li>
            <li>• Stay active to maximize your points throughout the season</li>
          </ul>
        </div>
      </div>
    )
  }
];

export default function DocPage() {
  const [selectedSection, setSelectedSection] = useState<string>(docSections[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentSection = docSections.find(s => s.id === selectedSection) || docSections[0];

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#0A3124] via-[#0A3124]/80 to-[#0A3124]/60'>
      {/* Mobile Header */}
      <div className='md:hidden bg-gray-900/95 border-b border-gray-800/50 px-4 py-3 flex items-center justify-between'>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className='text-white p-2'
        >
          <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
          </svg>
        </button>
        <h1 className='text-white font-bold text-lg'>Documentation</h1>
        <div className='w-10' /> {/* Spacer */}
      </div>

      <div className='flex'>
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed md:sticky top-0 left-0 h-screen w-64 bg-gray-900/95 border-r border-gray-800/50 z-40 transition-transform duration-300 overflow-y-auto`}
        >
          <div className='p-6'>
            <div className='mb-6'>
              <h2 className='text-xl font-bold text-white mb-1'>📚 Aurora Football League</h2>
              <p className='text-gray-400 text-sm'>Documentation</p>
            </div>
            
            {/* Navigation Links */}
            <div className='mb-6 pb-6 border-b border-gray-800/50 space-y-2'>
              <Link
                href={RouteNamesEnum.home}
                className='flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all text-sm'
              >
                <span>🏠</span>
                Landing Page
              </Link>
              <Link
                href={RouteNamesEnum.app}
                className='flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all text-sm'
              >
                <span>⚽</span>
                Launch App
              </Link>
            </div>
            
            <nav className='space-y-1'>
              {docSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSection(section.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    selectedSection === section.id
                      ? 'bg-[#3EB489]/20 text-[#3EB489] border border-[#3EB489]/30'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <span className='mr-2'>{section.emoji}</span>
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className='fixed inset-0 bg-black/50 z-30 md:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className='flex-1 min-h-screen'>
          <div className='max-w-4xl mx-auto px-6 py-8 md:py-12'>
            <div className='mb-8'>
              <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
                {currentSection.emoji} {currentSection.title}
              </h1>
              <div className='h-1 w-20 bg-[#3EB489] rounded-full'></div>
            </div>

            <div className='prose prose-invert prose-lg max-w-none'>
              <div className='text-gray-300 leading-relaxed'>
                {currentSection.content}
              </div>
            </div>

            {/* Navigation Footer */}
            <div className='mt-12 pt-8 border-t border-gray-800/50 flex justify-between'>
              <div>
                {docSections.findIndex(s => s.id === selectedSection) > 0 && (
                  <button
                    onClick={() => {
                      const currentIndex = docSections.findIndex(s => s.id === selectedSection);
                      setSelectedSection(docSections[currentIndex - 1].id);
                    }}
                    className='text-[#3EB489] hover:text-[#8ED6C1] transition-colors flex items-center gap-2'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                    </svg>
                    Previous
                  </button>
                )}
              </div>
              <div>
                {docSections.findIndex(s => s.id === selectedSection) < docSections.length - 1 && (
                  <button
                    onClick={() => {
                      const currentIndex = docSections.findIndex(s => s.id === selectedSection);
                      setSelectedSection(docSections[currentIndex + 1].id);
                    }}
                    className='text-[#3EB489] hover:text-[#8ED6C1] transition-colors flex items-center gap-2'
                  >
                    Next
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

