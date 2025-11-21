'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import pitchImage from '../../../../public/assets/img/pitch.png';

interface LeaderboardEntry {
  rank: number;
  teamName: string | null;
  wallet_address: string;
  points: number;
}

interface TeamPlayer {
  position: string;
  player_nft_identifier: string;
}

interface NFT {
  identifier: string;
  name: string;
  media: Array<{ url: string; originalUrl: string }>;
  url: string;
}

const NFT_COLLECTION = 'FOOT-9e4e8c';

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
  const [selectedTeam, setSelectedTeam] = useState<LeaderboardEntry | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<Record<string, NFT | null>>({
    ATT1: null,
    ATT2: null,
    DEF1: null,
    DEF2: null,
    GK: null
  });
  const [loadingTeam, setLoadingTeam] = useState(false);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Load leaderboard from database
  useEffect(() => {
    const loadLeaderboard = async () => {
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
      }
    };

    loadLeaderboard();
  }, []);

  const handleTeamClick = async (entry: LeaderboardEntry) => {
    setSelectedTeam(entry);
    setLoadingTeam(true);
    
    try {
      // Fetch team players
      const playersResponse = await fetch(`/api/teams/players?wallet_address=${entry.wallet_address}`);
      const playersResult = await playersResponse.json();
      
      if (!playersResult.success || !playersResult.data || playersResult.data.length === 0) {
        setTeamPlayers({
          ATT1: null,
          ATT2: null,
          DEF1: null,
          DEF2: null,
          GK: null
        });
        setLoadingTeam(false);
        return;
      }

      // Fetch NFT data for each player
      const players: TeamPlayer[] = playersResult.data;
      const nftIdentifiers = players.map(p => p.player_nft_identifier);
      
      // Fetch NFTs from MultiversX API
      const nftPromises = nftIdentifiers.map(async (identifier) => {
        try {
          const response = await fetch(`https://devnet-api.multiversx.com/nfts/${identifier}`);
          if (response.ok) {
            return await response.json();
          }
          return null;
        } catch (error) {
          console.error(`Error fetching NFT ${identifier}:`, error);
          return null;
        }
      });

      const nftData = await Promise.all(nftPromises);
      
      // Map NFTs to positions
      const mappedPlayers: Record<string, NFT | null> = {
        ATT1: null,
        ATT2: null,
        DEF1: null,
        DEF2: null,
        GK: null
      };

      players.forEach((player, index) => {
        const nft = nftData[index];
        if (nft) {
          mappedPlayers[player.position] = {
            identifier: nft.identifier,
            name: nft.name || nft.identifier,
            media: nft.media || [],
            url: nft.url || ''
          };
        }
      });

      setTeamPlayers(mappedPlayers);
    } catch (error) {
      console.error('Error loading team:', error);
      setTeamPlayers({
        ATT1: null,
        ATT2: null,
        DEF1: null,
        DEF2: null,
        GK: null
      });
    } finally {
      setLoadingTeam(false);
    }
  };

  const getPlayerImage = (nft: NFT | null) => {
    if (!nft) return null;
    return nft.media?.[0]?.url || nft.media?.[0]?.originalUrl || nft.url || null;
  };

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
                <div className='text-5xl'>
                  🥈
                </div>
              </div>
              <p 
                className='text-base font-semibold text-white text-center cursor-pointer hover:text-[#8ED6C1] transition-colors'
                onClick={() => topThree[1] && handleTeamClick(topThree[1])}
              >
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
                <div className='text-6xl'>
                  🥇
                </div>
              </div>
              <p 
                className='text-lg font-bold text-white text-center cursor-pointer hover:text-[#3EB489] transition-colors'
                onClick={() => topThree[0] && handleTeamClick(topThree[0])}
              >
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
                <div className='text-5xl'>
                  🥉
                </div>
              </div>
              <p 
                className='text-base font-semibold text-white text-center cursor-pointer hover:text-[#3EB489] transition-colors'
                onClick={() => topThree[2] && handleTeamClick(topThree[2])}
              >
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
                    <p 
                      className='text-base font-semibold text-white truncate cursor-pointer hover:text-[#3EB489] transition-colors'
                      onClick={() => handleTeamClick(entry)}
                    >
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

      {/* Team View Modal */}
      {selectedTeam && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm'
          onClick={() => setSelectedTeam(null)}
        >
          <div
            className='relative max-w-2xl w-full bg-gradient-to-br from-gray-900/95 to-black rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl flex flex-col'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-800/50'>
              <div>
                <h2 className='text-2xl font-bold text-white'>
                  {selectedTeam.teamName || 'Unnamed Team'}
                </h2>
                <p className='text-sm text-white/60 mt-1'>
                  Rank #{selectedTeam.rank} • {(selectedTeam.points || 0).toLocaleString()} P
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className='p-2 hover:bg-gray-800/50 rounded-full transition-colors'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='white'
                  className='w-6 h-6'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            {/* Pitch Display */}
            <div className='flex-1 overflow-y-auto p-6'>
              {loadingTeam ? (
                <div className='flex items-center justify-center py-12'>
                  <div className='text-white/70'>Loading team...</div>
                </div>
              ) : (
                <div className='relative w-full bg-gradient-to-b from-[#0A3124] to-[#0A3124]/80 rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl'>
                  <div className='relative w-full aspect-[3/4] overflow-hidden'>
                    <Image
                      src={pitchImage}
                      alt='Football Pitch'
                      fill
                      className='object-cover scale-150'
                      priority
                    />

                    {/* Players Formation */}
                    <div className='absolute inset-0 flex flex-col justify-between p-6'>
                      {/* Attackers Row (Top) */}
                      <div className='flex justify-center gap-12'>
                        <div className='flex flex-col items-center gap-2'>
                          <div className='relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 shadow-lg bg-gray-800/50 flex items-center justify-center'>
                            {getPlayerImage(teamPlayers.ATT1) ? (
                              <img
                                src={getPlayerImage(teamPlayers.ATT1) || ''}
                                alt={teamPlayers.ATT1?.name || 'ATT1'}
                                className='w-full h-full object-cover scale-110'
                              />
                            ) : (
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 24 24'
                                strokeWidth={1.5}
                                stroke='currentColor'
                                className='w-8 h-8 text-white/60'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
                                />
                              </svg>
                            )}
                          </div>
                          <p className='text-[10px] font-semibold text-white text-center max-w-[100px] truncate drop-shadow-lg'>
                            {teamPlayers.ATT1?.name || 'ATT1'}
                          </p>
                        </div>
                        <div className='flex flex-col items-center gap-2'>
                          <div className='relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 shadow-lg bg-gray-800/50 flex items-center justify-center'>
                            {getPlayerImage(teamPlayers.ATT2) ? (
                              <img
                                src={getPlayerImage(teamPlayers.ATT2) || ''}
                                alt={teamPlayers.ATT2?.name || 'ATT2'}
                                className='w-full h-full object-cover scale-110'
                              />
                            ) : (
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 24 24'
                                strokeWidth={1.5}
                                stroke='currentColor'
                                className='w-8 h-8 text-white/60'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
                                />
                              </svg>
                            )}
                          </div>
                          <p className='text-[10px] font-semibold text-white text-center max-w-[100px] truncate drop-shadow-lg'>
                            {teamPlayers.ATT2?.name || 'ATT2'}
                          </p>
                        </div>
                      </div>

                      {/* Defenders Row (Middle) */}
                      <div className='flex justify-center gap-12'>
                        <div className='flex flex-col items-center gap-2'>
                          <div className='relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 shadow-lg bg-gray-800/50 flex items-center justify-center'>
                            {getPlayerImage(teamPlayers.DEF1) ? (
                              <img
                                src={getPlayerImage(teamPlayers.DEF1) || ''}
                                alt={teamPlayers.DEF1?.name || 'DEF1'}
                                className='w-full h-full object-cover scale-110'
                              />
                            ) : (
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 24 24'
                                strokeWidth={1.5}
                                stroke='currentColor'
                                className='w-8 h-8 text-white/60'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
                                />
                              </svg>
                            )}
                          </div>
                          <p className='text-[10px] font-semibold text-white text-center max-w-[100px] truncate drop-shadow-lg'>
                            {teamPlayers.DEF1?.name || 'DEF1'}
                          </p>
                        </div>
                        <div className='flex flex-col items-center gap-2'>
                          <div className='relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 shadow-lg bg-gray-800/50 flex items-center justify-center'>
                            {getPlayerImage(teamPlayers.DEF2) ? (
                              <img
                                src={getPlayerImage(teamPlayers.DEF2) || ''}
                                alt={teamPlayers.DEF2?.name || 'DEF2'}
                                className='w-full h-full object-cover scale-110'
                              />
                            ) : (
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 24 24'
                                strokeWidth={1.5}
                                stroke='currentColor'
                                className='w-8 h-8 text-white/60'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
                                />
                              </svg>
                            )}
                          </div>
                          <p className='text-[10px] font-semibold text-white text-center max-w-[100px] truncate drop-shadow-lg'>
                            {teamPlayers.DEF2?.name || 'DEF2'}
                          </p>
                        </div>
                      </div>

                      {/* Goalkeeper (Bottom) */}
                      <div className='flex justify-center'>
                        <div className='flex flex-col items-center gap-2'>
                          <div className='relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 shadow-lg bg-gray-800/50 flex items-center justify-center'>
                            {getPlayerImage(teamPlayers.GK) ? (
                              <img
                                src={getPlayerImage(teamPlayers.GK) || ''}
                                alt={teamPlayers.GK?.name || 'GK'}
                                className='w-full h-full object-cover scale-110'
                              />
                            ) : (
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 24 24'
                                strokeWidth={1.5}
                                stroke='currentColor'
                                className='w-8 h-8 text-white/60'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
                                />
                              </svg>
                            )}
                          </div>
                          <p className='text-[10px] font-semibold text-white text-center max-w-[100px] truncate drop-shadow-lg'>
                            {teamPlayers.GK?.name || 'GK'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
