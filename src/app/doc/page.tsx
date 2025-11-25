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
    title: 'Executive Summary',
    emoji: '📋',
    content: (
      <div className='space-y-4'>
        <p className='text-lg text-gray-300 leading-relaxed'>
          <span className='font-bold text-[#3EB489]'>Aurora Fantasy League</span> is an on-chain fantasy football manager where players collect and manage NFT-based fantasy player cards, compete in monthly seasons, and climb leaderboards driven by real-world match data.
        </p>
        <p className='text-gray-300 leading-relaxed'>
          By combining accessible gameplay with verifiable on-chain ownership, Aurora Fantasy League targets both traditional football fans and crypto-native users, offering a low-friction way to play, enjoy, and earn with your favourite players — through fantasy cards that mirror the performance of real-world football.
        </p>
        <p className='text-gray-300 leading-relaxed'>
          At launch, players will build compact squads of 5 fantasy players (1 GK, 2 DEF, 2 FWD) and join short monthly seasons. In the long term, Aurora Fantasy League plans to support full 11-a-side squads and run special, time-limited mega-tournaments that mirror major international competitions such as the summer World Cup.
        </p>
      </div>
    )
  },
  {
    id: 'vision',
    title: 'Vision & Core Principles',
    emoji: '🎯',
    content: (
      <div className='space-y-6'>
        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Vision</h3>
        <p className='text-gray-300 leading-relaxed'>
          Become the most accessible on-chain fantasy football manager, where you can draft a small team, compete in short monthly seasons, and truly own your favourite players as NFTs – through fantasy cards that transparently track real-world football performance.
        </p>

        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Target Audience</h3>
        <p className='text-gray-300 leading-relaxed mb-4'>
          Aurora Fantasy League is designed for a hybrid audience:
        </p>
        <ul className='list-disc list-inside space-y-2 text-gray-300 ml-4'>
          <li><strong className='text-white'>Football fans</strong> who want a simple, fast-paced fantasy experience without complex squad management or season-long grind.</li>
          <li><strong className='text-white'>Crypto-native users</strong> who value on-chain ownership, NFT trading, and open economies.</li>
        </ul>
        <p className='text-gray-300 leading-relaxed mt-4'>
          The long-term goal is to bridge these two worlds: make it easy for football fans to enter web3, while still giving crypto users a deep, tradable NFT ecosystem.
        </p>

        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Core Promise</h3>
        <div className='bg-[#3EB489]/10 border border-[#3EB489]/30 rounded-lg p-6 mt-4'>
          <p className='text-[#3EB489] font-bold text-xl mb-2'>Play, enjoy and earn with your favourite players.</p>
          <p className='text-gray-300 text-sm'>
            Players build compact squads using NFT fantasy player cards, join monthly seasons, and compete on transparent, on-chain leaderboards that are backed by official football performance data.
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
        <p className='text-gray-300 leading-relaxed'>
          Aurora Fantasy League is an on-chain fantasy football manager with three core pillars:
        </p>
        <div className='space-y-4 mt-6'>
          <div className='bg-gray-800/50 rounded-lg p-5 border border-gray-700/50'>
            <h4 className='text-lg font-bold text-white mb-2 flex items-center gap-2'>
              🎴 Fantasy Player NFTs
            </h4>
            <p className='text-gray-300 text-sm'>
              Every player in your squad is an NFT card that you own, trade and use in competitive seasons.
            </p>
          </div>
          <div className='bg-gray-800/50 rounded-lg p-5 border border-gray-700/50'>
            <h4 className='text-lg font-bold text-white mb-2 flex items-center gap-2'>
              📅 Monthly Seasons
            </h4>
            <p className='text-gray-300 text-sm'>
              Short, recurring seasons (approximately one month each), with clear start/end dates and a single main leaderboard.
            </p>
          </div>
          <div className='bg-gray-800/50 rounded-lg p-5 border border-gray-700/50'>
            <h4 className='text-lg font-bold text-white mb-2 flex items-center gap-2'>
              ⚽ Real-World Data
            </h4>
            <p className='text-gray-300 text-sm'>
              Fantasy scoring is driven by official football match data mapped onto fantasy players, using a fixed, public scoring system.
            </p>
          </div>
        </div>

        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Squad Structure</h3>
        <p className='text-gray-300 leading-relaxed'>
          At launch, squads will consist of 5 players:
        </p>
        <ul className='list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4'>
          <li><strong className='text-white'>1 Goalkeeper (GK)</strong> 🥅</li>
          <li><strong className='text-white'>2 Defenders (DEF)</strong> 🛡️</li>
          <li><strong className='text-white'>2 Forwards (FWD)</strong> ⚽</li>
        </ul>
        <p className='text-gray-300 leading-relaxed mt-4'>
          Over time, Aurora Fantasy League aims to expand this structure to full 11-a-side squads, enabling deeper tactics and special tournament formats that mirror real-world football.
        </p>
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
                <span className='text-[#3EB489] font-semibold'>+2</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Penalty Save</span>
                <span className='text-[#3EB489] font-semibold'>+3</span>
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
          Aurora Fantasy League is structured around short, recurring seasons rather than year-long campaigns.
        </p>
        <ul className='list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4'>
          <li>Each season will last approximately <strong className='text-white'>one month</strong></li>
          <li>The exact start and end dates for each season will be announced before the season begins</li>
          <li>This format keeps the game dynamic, allows frequent "fresh starts" and reduces long-term commitment</li>
        </ul>

        <div className='bg-[#3EB489]/10 border border-[#3EB489]/30 rounded-lg p-6 mt-6'>
          <h4 className='text-xl font-bold text-[#3EB489] mb-3'>Season 1 Dates</h4>
          <p className='text-white text-lg font-semibold'>29/11 to 4/1 2026</p>
          <p className='text-gray-300 text-sm mt-2'>Get ready to compete! ⚽</p>
        </div>

        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Leagues & Coverage</h3>
        <p className='text-gray-300 leading-relaxed'>
          Aurora Fantasy League is built to track real-world football performance and map it to fantasy players.
        </p>
        <p className='text-gray-300 leading-relaxed mt-4'>
          In the initial phase, the game will focus on players from a single league (specific league to be decided), ensuring tight control over data, UX and balancing.
        </p>
        <p className='text-gray-300 leading-relaxed mt-4'>
          At launch, the ecosystem will start with <strong className='text-white'>15 fantasy player NFTs</strong>, with additional players and collections added gradually over time.
        </p>

        <h3 className='text-2xl font-bold text-white mt-8 mb-4'>Leaderboard & Winners</h3>
        <p className='text-gray-300 leading-relaxed'>
          Each season will have one main leaderboard:
        </p>
        <ul className='list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4'>
          <li>All participating teams are ranked by total fantasy points over the season</li>
          <li>At the end of the season, top-ranked teams receive rewards</li>
          <li>The exact number of rewarded positions and payout structure will be announced before each season begins</li>
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
        <p className='text-gray-300 leading-relaxed'>
          Aurora Fantasy League is built as a competitive game where skill, strategy and football knowledge are rewarded.
        </p>
        <p className='text-gray-300 leading-relaxed mt-4'>
          Seasonal rewards will be distributed on-chain in the form of tokens and/or stablecoins supported by the underlying blockchain ecosystem.
        </p>
        <p className='text-gray-300 leading-relaxed mt-4'>
          The exact reward pools, payout curves, and token types for each season will be announced before that season begins.
        </p>
        <div className='bg-[#3EB489]/10 border border-[#3EB489]/30 rounded-lg p-6 mt-6'>
          <p className='text-[#3EB489] font-semibold mb-2'>🎯 Reward Goals</p>
          <ul className='space-y-2 text-gray-300 text-sm'>
            <li>• Incentivize skilled play and active participation</li>
            <li>• Support an active trading ecosystem around fantasy player NFTs</li>
            <li>• Align long-term player engagement with the health of the overall platform</li>
          </ul>
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

