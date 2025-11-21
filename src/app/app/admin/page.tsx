'use client';
import { useState, useEffect } from 'react';
import { useGetIsLoggedIn } from '@/lib';
import { Button } from '@/components/Button';

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

  if (!isLoggedIn) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] gap-4 px-4'>
        <h2 className='text-2xl font-bold text-white'>🔒 Admin Access Required</h2>
        <p className='text-white/80 text-center'>Please connect your wallet to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className='w-full max-w-6xl mx-auto px-4 py-6 space-y-6'>
      {/* Header */}
      <div className='text-center mb-8'>
        <h1 className='text-3xl md:text-4xl font-bold text-white mb-2'>
          ⚽ Admin Panel
        </h1>
        <p className='text-white/70'>Manage Players & Points</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className='bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200'>
          {error}
        </div>
      )}

      {/* Add Player Form */}
      <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-6 shadow-2xl border border-gray-800/50'>
        <h2 className='text-xl font-bold text-white mb-4'>➕ Add New Player</h2>
        <div className='grid md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium text-white/80 mb-2'>
              NFT Identifier
            </label>
            <input
              type='text'
              value={newPlayerIdentifier}
              onChange={(e) => setNewPlayerIdentifier(e.target.value)}
              placeholder='e.g., FOOT-9e4e8c-abc123'
              className='w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3EB489]'
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
              className='w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3EB489]'
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
              className='w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3EB489]'
            />
          </div>
        </div>
        <div className='mt-4'>
          <Button
            onClick={handleAddPlayer}
            disabled={isAddingPlayer || !newPlayerIdentifier.trim() || !newPlayerName.trim()}
            className='bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white px-6 py-2 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isAddingPlayer ? 'Adding...' : 'Add Player'}
          </Button>
        </div>
      </div>

      {/* Players Table */}
      <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-6 shadow-2xl border border-gray-800/50'>
        <h2 className='text-xl font-bold text-white mb-4'>📊 All Players</h2>
        
        {loading ? (
          <div className='text-center py-8 text-white/70'>Loading players...</div>
        ) : players.length === 0 ? (
          <div className='text-center py-8 text-white/70'>No players found. Add your first player above!</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-700'>
                  <th className='text-left py-3 px-4 text-white/80 font-semibold'>Identifier</th>
                  <th className='text-left py-3 px-4 text-white/80 font-semibold'>Name</th>
                  <th className='text-left py-3 px-4 text-white/80 font-semibold'>Collection</th>
                  <th className='text-left py-3 px-4 text-white/80 font-semibold'>Points</th>
                  <th className='text-left py-3 px-4 text-white/80 font-semibold'>Points Change</th>
                  <th className='text-center py-3 px-4 text-white/80 font-semibold'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.nft_identifier} className='border-b border-gray-800/50 hover:bg-gray-800/30'>
                    <td className='py-3 px-4 text-white/90 text-sm font-mono'>{player.nft_identifier}</td>
                    <td className='py-3 px-4 text-white font-semibold'>{player.name}</td>
                    <td className='py-3 px-4 text-white/70 text-sm'>{player.collection}</td>
                    <td className='py-3 px-4'>
                      <span className='text-[#3EB489] font-bold text-lg'>{player.points}</span>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex gap-2 items-center'>
                        <input
                          type='number'
                          value={pointsInputs[player.nft_identifier] || ''}
                          onChange={(e) => setPointsInputs((prev) => ({ ...prev, [player.nft_identifier]: e.target.value }))}
                          placeholder='±points'
                          className='w-24 px-2 py-1 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#3EB489]'
                        />
                        <button
                          onClick={() => {
                            const change = parseInt(pointsInputs[player.nft_identifier] || '0');
                            if (change !== 0) {
                              handleUpdatePoints(player.nft_identifier, change);
                            }
                          }}
                          disabled={updatingPoints === player.nft_identifier || !pointsInputs[player.nft_identifier]}
                          className='px-3 py-1 bg-[#3EB489] text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          {updatingPoints === player.nft_identifier ? '...' : 'Apply'}
                        </button>
                        <button
                          onClick={() => handleUpdatePoints(player.nft_identifier, 1)}
                          disabled={updatingPoints === player.nft_identifier}
                          className='px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50'
                          title='Add 1 point'
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleUpdatePoints(player.nft_identifier, -1)}
                          disabled={updatingPoints === player.nft_identifier}
                          className='px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50'
                          title='Subtract 1 point'
                        >
                          -1
                        </button>
                      </div>
                    </td>
                    <td className='py-3 px-4 text-center'>
                      <button
                        onClick={() => handleDeletePlayer(player.nft_identifier)}
                        className='px-4 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-semibold transition-colors'
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
    </div>
  );
}

