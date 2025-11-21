'use client';
import { useState, useEffect } from 'react';
import { useGetIsLoggedIn } from '@/lib';
import { Button } from '@/components/Button';
import { AuthRedirectWrapper } from '@/wrappers';
import { ConnectButton } from '@/components/Layout/Header/components';

interface Player {
  nft_identifier: string;
  name: string;
  collection: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export default function AdminPage() {
  const isLoggedIn = useGetIsLoggedIn();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Add player form
  const [newPlayerIdentifier, setNewPlayerIdentifier] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerCollection, setNewPlayerCollection] = useState('FOOT-9e4e8c');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  
  // Points management
  const [pointsInputs, setPointsInputs] = useState<Record<string, string>>({});
  const [updatingPoints, setUpdatingPoints] = useState<string | null>(null);

  // Fetch all players
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/players');
      const result = await response.json();
      
      if (result.success) {
        setPlayers(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch players');
      }
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to fetch players');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchPlayers();
    }
  }, [isLoggedIn]);

  // Add new player
  const handleAddPlayer = async () => {
    if (!newPlayerIdentifier.trim() || !newPlayerName.trim()) {
      setError('Please fill in both identifier and name');
      return;
    }

    try {
      setIsAddingPlayer(true);
      setError('');
      const response = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nft_identifier: newPlayerIdentifier.trim(),
          name: newPlayerName.trim(),
          collection: newPlayerCollection.trim() || 'FOOT-9e4e8c',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setNewPlayerIdentifier('');
        setNewPlayerName('');
        setNewPlayerCollection('FOOT-9e4e8c');
        await fetchPlayers();
      } else {
        setError(result.error || 'Failed to add player');
      }
    } catch (err) {
      console.error('Error adding player:', err);
      setError('Failed to add player');
    } finally {
      setIsAddingPlayer(false);
    }
  };

  // Update player points
  const handleUpdatePoints = async (nftIdentifier: string, pointsChange: number) => {
    try {
      setUpdatingPoints(nftIdentifier);
      setError('');
      const response = await fetch('/api/admin/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nft_identifier: nftIdentifier,
          points_change: pointsChange,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchPlayers();
        setPointsInputs((prev) => ({ ...prev, [nftIdentifier]: '' }));
      } else {
        setError(result.error || 'Failed to update points');
      }
    } catch (err) {
      console.error('Error updating points:', err);
      setError('Failed to update points');
    } finally {
      setUpdatingPoints(null);
    }
  };

  // Delete player
  const handleDeletePlayer = async (nftIdentifier: string) => {
    if (!confirm(`Are you sure you want to delete player "${nftIdentifier}"?`)) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/admin/players?nft_identifier=${encodeURIComponent(nftIdentifier)}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchPlayers();
      } else {
        setError(result.error || 'Failed to delete player');
      }
    } catch (err) {
      console.error('Error deleting player:', err);
      setError('Failed to delete player');
    }
  };

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <div className='w-full min-h-screen bg-gradient-to-b from-[#0A3124] via-[#0A3124]/80 to-[#0A3124]/60 relative overflow-hidden pt-24 md:pt-32'>
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
              className='absolute inset-0'
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #3EB489 10px, #3EB489 20px)'
              }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className='relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8'>
          {/* Header */}
          <div className='text-center mb-8'>
            <h1 className='text-4xl md:text-5xl font-bold text-white mb-3'>
              ⚽ Admin Panel
            </h1>
            <p className='text-white/70 text-lg'>Manage Players & Points</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className='bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-center'>
              {error}
            </div>
          )}

          {/* Not Logged In Message */}
          {!isLoggedIn && (
            <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-800/50 text-center'>
              <h2 className='text-2xl md:text-3xl font-bold text-white mb-4'>🔒 Admin Access Required</h2>
              <p className='text-white/80 text-lg mb-6'>Please connect your wallet to access the admin panel.</p>
              <div className='flex justify-center'>
                <ConnectButton />
              </div>
            </div>
          )}

          {/* Add Player Form */}
          {isLoggedIn && (
            <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-800/50'>
              <h2 className='text-2xl font-bold text-white mb-6'>➕ Add New Player</h2>
              <div className='grid md:grid-cols-3 gap-4 md:gap-6'>
                <div>
                  <label className='block text-sm font-medium text-white/80 mb-2'>
                    NFT Identifier
                  </label>
                  <input
                    type='text'
                    value={newPlayerIdentifier}
                    onChange={(e) => setNewPlayerIdentifier(e.target.value)}
                    placeholder='e.g., FOOT-9e4e8c-abc123'
                    className='w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3EB489] transition-colors'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-white/80 mb-2'>
                    Player Name
                  </label>
                  <input
                    type='text'
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder='e.g., SALAH'
                    className='w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3EB489] transition-colors'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-white/80 mb-2'>
                    Collection (optional)
                  </label>
                  <input
                    type='text'
                    value={newPlayerCollection}
                    onChange={(e) => setNewPlayerCollection(e.target.value)}
                    placeholder='FOOT-9e4e8c'
                    className='w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3EB489] transition-colors'
                  />
                </div>
              </div>
              <div className='mt-6'>
                <Button
                  onClick={handleAddPlayer}
                  disabled={isAddingPlayer || !newPlayerIdentifier.trim() || !newPlayerName.trim()}
                  className='bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity'
                >
                  {isAddingPlayer ? 'Adding...' : 'Add Player'}
                </Button>
              </div>
            </div>
          )}

          {/* Players Table */}
          {isLoggedIn && (
            <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-800/50'>
              <h2 className='text-2xl font-bold text-white mb-6'>📊 All Players</h2>
              
              {loading ? (
                <div className='text-center py-12 text-white/70 text-lg'>Loading players...</div>
              ) : players.length === 0 ? (
                <div className='text-center py-12 text-white/70 text-lg'>No players found. Add your first player above!</div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-gray-700'>
                        <th className='text-left py-4 px-4 text-white/80 font-semibold text-sm md:text-base'>Identifier</th>
                        <th className='text-left py-4 px-4 text-white/80 font-semibold text-sm md:text-base'>Name</th>
                        <th className='text-left py-4 px-4 text-white/80 font-semibold text-sm md:text-base hidden md:table-cell'>Collection</th>
                        <th className='text-left py-4 px-4 text-white/80 font-semibold text-sm md:text-base'>Points</th>
                        <th className='text-left py-4 px-4 text-white/80 font-semibold text-sm md:text-base'>Points Change</th>
                        <th className='text-center py-4 px-4 text-white/80 font-semibold text-sm md:text-base'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player) => (
                        <tr key={player.nft_identifier} className='border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors'>
                          <td className='py-4 px-4 text-white/90 text-xs md:text-sm font-mono break-all'>{player.nft_identifier}</td>
                          <td className='py-4 px-4 text-white font-semibold text-sm md:text-base'>{player.name}</td>
                          <td className='py-4 px-4 text-white/70 text-xs md:text-sm hidden md:table-cell'>{player.collection}</td>
                          <td className='py-4 px-4'>
                            <span className='text-[#3EB489] font-bold text-lg md:text-xl'>{player.points}</span>
                          </td>
                          <td className='py-4 px-4'>
                            <div className='flex flex-wrap gap-2 items-center'>
                              <input
                                type='number'
                                value={pointsInputs[player.nft_identifier] || ''}
                                onChange={(e) => setPointsInputs((prev) => ({ ...prev, [player.nft_identifier]: e.target.value }))}
                                placeholder='±points'
                                className='w-20 md:w-24 px-2 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-xs md:text-sm placeholder-gray-500 focus:outline-none focus:border-[#3EB489] transition-colors'
                              />
                              <button
                                onClick={() => {
                                  const change = parseInt(pointsInputs[player.nft_identifier] || '0');
                                  if (change !== 0) {
                                    handleUpdatePoints(player.nft_identifier, change);
                                  }
                                }}
                                disabled={updatingPoints === player.nft_identifier || !pointsInputs[player.nft_identifier]}
                                className='px-3 py-1.5 bg-[#3EB489] text-white rounded-lg text-xs md:text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity'
                              >
                                {updatingPoints === player.nft_identifier ? '...' : 'Apply'}
                              </button>
                              <button
                                onClick={() => handleUpdatePoints(player.nft_identifier, 1)}
                                disabled={updatingPoints === player.nft_identifier}
                                className='px-2 md:px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity'
                                title='Add 1 point'
                              >
                                +1
                              </button>
                              <button
                                onClick={() => handleUpdatePoints(player.nft_identifier, -1)}
                                disabled={updatingPoints === player.nft_identifier}
                                className='px-2 md:px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity'
                                title='Subtract 1 point'
                              >
                                -1
                              </button>
                            </div>
                          </td>
                          <td className='py-4 px-4 text-center'>
                            <button
                              onClick={() => handleDeletePlayer(player.nft_identifier)}
                              className='px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs md:text-sm font-semibold transition-colors'
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthRedirectWrapper>
  );
}

