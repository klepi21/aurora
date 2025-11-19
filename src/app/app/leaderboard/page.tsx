'use client';
import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  teamName: string | null;
  wallet_address: string;
  points: number;
}

const getInitials = (teamName: string | null) => {
  if (!teamName) return 'UT';
  return teamName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Load leaderboard from database
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/leaderboard?limit=100');
        const result = await response.json();

        if (result.success && result.data) {
          setLeaderboard(result.data);
        } else {
          console.error('Failed to load leaderboard:', result.error);
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const getRankBorderColor = (rank: number) => {
    if (rank === 1) return 'border-[#3EB489]';
    if (rank === 2) return 'border-[#8ED6C1]';
    if (rank === 3) return 'border-[#3EB489]';
    return 'border-gray-700';
  };

  const getRankTextColor = (rank: number) => {
    if (rank === 1) return 'text-[#3EB489]';
    if (rank === 2) return 'text-[#8ED6C1]';
    if (rank === 3) return 'text-[#3EB489]';
    return 'text-white';
  };

  const getRankGradientBorder = (rank: number) => {
    if (rank === 1) return 'from-[#3EB489] to-[#8ED6C1]';
    if (rank === 2) return 'from-[#8ED6C1] to-[#3EB489]';
    if (rank === 3) return 'from-[#3EB489] to-[#8ED6C1]';
    return 'from-gray-700 to-gray-800';
  };

  const formatDate = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'long' });
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    // Add ordinal suffix
    const getOrdinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `Last Updated: ${getOrdinal(day)} ${month}, ${hours}:${minutes}`;
  };

  return (
    <div className='flex flex-col w-full pb-6'>
      {/* Top 3 Podium Section */}
      <div className='bg-gradient-to-br from-[#0A3124]/95 to-black rounded-3xl p-6 shadow-2xl border border-gray-800/50 mb-5'>
        {/* Last Updated Header */}
        <p className='text-xs text-gray-400 text-center mb-6'>{formatDate()}</p>
        
        {/* Podium Layout */}
        <div className='flex items-end justify-center gap-4 relative'>
          {/* 2nd Place - Left */}
          {topThree[1] && (
            <div className='flex flex-col items-center gap-3 flex-1 max-w-[120px]'>
              <div
                className={`relative w-24 h-24 rounded-full border-4 ${getRankBorderColor(2)} bg-gray-800 flex items-center justify-center overflow-hidden`}
              >
                <div className='text-2xl font-bold text-white'>
                  {getInitials(topThree[1]?.teamName || null)}
                </div>
              </div>
              <p className='text-base font-semibold text-white text-center'>
                {topThree[1]?.teamName || 'Unnamed Team'}
              </p>
              <p className={`text-lg font-bold ${getRankTextColor(2)}`}>
                {(topThree[1]?.points || 0).toLocaleString()} P
              </p>
            </div>
          )}

          {/* 1st Place - Center (Largest) */}
          {topThree[0] && (
            <div className='flex flex-col items-center gap-3 flex-1 max-w-[140px]'>
              <div
                className={`relative w-32 h-32 rounded-full border-4 ${getRankBorderColor(1)} bg-gray-800 flex items-center justify-center overflow-hidden`}
              >
                <div className='text-3xl font-bold text-white'>
                  {getInitials(topThree[0]?.teamName || null)}
                </div>
              </div>
              <p className='text-lg font-bold text-white text-center'>
                {topThree[0]?.teamName || 'Unnamed Team'}
              </p>
              <p className={`text-xl font-bold ${getRankTextColor(1)}`}>
                {(topThree[0]?.points || 0).toLocaleString()} P
              </p>
            </div>
          )}

          {/* 3rd Place - Right */}
          {topThree[2] && (
            <div className='flex flex-col items-center gap-3 flex-1 max-w-[120px]'>
              <div
                className={`relative w-24 h-24 rounded-full border-4 ${getRankBorderColor(3)} bg-gray-800 flex items-center justify-center overflow-hidden`}
              >
                <div className='text-2xl font-bold text-white'>
                  {getInitials(topThree[2]?.teamName || null)}
                </div>
              </div>
              <p className='text-base font-semibold text-white text-center'>
                {topThree[2]?.teamName || 'Unnamed Team'}
              </p>
              <p className={`text-lg font-bold ${getRankTextColor(3)}`}>
                {(topThree[2]?.points || 0).toLocaleString()} P
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rest of Leaderboard List */}
      <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-6 shadow-2xl border border-gray-800/50'>
        <div className='flex flex-col gap-3'>
          {rest.map((entry) => {
            const borderGradient = getRankGradientBorder(entry.rank);
            const borderColor = getRankBorderColor(entry.rank);
            
            return (
              <div
                key={entry.rank}
                className={`relative p-4 bg-gray-800/30 rounded-2xl border-2 ${borderColor}`}
              >
                <div className='flex items-center gap-4'>
                  {/* Rank Number */}
                  <div className='flex items-center justify-center w-8 h-8 flex-shrink-0'>
                    <span className='text-lg font-bold text-white'>
                      {entry.rank.toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Team Name */}
                  <div className='flex-1 min-w-0'>
                    <p className='text-base font-semibold text-white truncate'>
                      {entry.teamName || 'Unnamed Team'}
                    </p>
                  </div>

                  {/* Points */}
                  <div className='flex-shrink-0'>
                    <p className='text-base font-bold text-white'>
                      {(entry.points || 0).toLocaleString()} P
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
