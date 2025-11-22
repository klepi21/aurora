'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useGetAccountInfo,
  useGetNetworkConfig,
  Transaction,
  Address,
  useGetPendingTransactions
} from '@/lib';
import { signAndSendTransactions } from '@/helpers/signAndSendTransactions';
import { GAS_PRICE } from '@/localConstants';
import Image from 'next/image';
import pitchImage from '../../../../public/assets/img/pitch.png';

const NFT_COLLECTION = 'FOOT-9e4e8c';
const TRANSFER_RECEIVER = 'erd1u5p4njlv9rxvzvmhsxjypa69t2dran33x9ttpx0ghft7tt35wpfsxgynw4';
const TRANSFER_COST_PER_PLAYER = '200000000000000000'; // 0.2 EGLD

interface NFT {
  identifier: string;
  name: string;
  media: Array<{ url: string; originalUrl: string }>;
  url: string;
}


export default function SquadsPage() {
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, NFT | null>>({
    ATT1: null,
    ATT2: null,
    DEF1: null,
    DEF2: null,
    GK: null
  });
  const [teamName, setTeamName] = useState<string>('');
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [teamSaved, setTeamSaved] = useState<boolean>(false);
  const [teamPoints, setTeamPoints] = useState<number>(0);
  const [showSuccessNotification, setShowSuccessNotification] = useState<boolean>(false);
  const [isTransferMode, setIsTransferMode] = useState<boolean>(false);
  const [originalPlayers, setOriginalPlayers] = useState<Record<string, NFT | null>>({
    ATT1: null,
    ATT2: null,
    DEF1: null,
    DEF2: null,
    GK: null
  });
  const [pendingTransferTxHash, setPendingTransferTxHash] = useState<string>('');
  const pendingTransactions = useGetPendingTransactions();
  const pitchRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  // Load team name from database
  useEffect(() => {
    const loadTeamName = async () => {
      if (!address) return;

      try {
        const teamResponse = await fetch(`/api/teams?wallet_address=${address}`);
        const teamResult = await teamResponse.json();
        
        if (teamResult.success && teamResult.data?.team_name) {
          setTeamName(teamResult.data.team_name);
        }
      } catch (error) {
        console.error('Error loading team name:', error);
      }
    };

    loadTeamName();
  }, [address]);

  // Load existing team players after NFTs are loaded
  useEffect(() => {
    const loadTeamPlayers = async () => {
      if (!address || nfts.length === 0) return;

      try {
        const teamPlayersResponse = await fetch(`/api/teams/players?wallet_address=${address}`);
        const teamPlayersResult = await teamPlayersResponse.json();
        
        if (teamPlayersResult.success && teamPlayersResult.data && teamPlayersResult.data.length > 0) {
          const players: Record<string, NFT | null> = {
            ATT1: null,
            ATT2: null,
            DEF1: null,
            DEF2: null,
            GK: null
          };

          // Match NFT identifiers with loaded NFTs
          teamPlayersResult.data.forEach((player: { position: string; player_nft_identifier: string }) => {
            const matchedNft = nfts.find((nft) => nft.identifier === player.player_nft_identifier);
            if (matchedNft) {
              players[player.position] = matchedNft;
            }
          });

          setSelectedPlayers(players);
          setOriginalPlayers({ ...players }); // Store original for comparison
          setTeamSaved(true);
        } else {
          setTeamSaved(false);
        }

        // Load team points
        const teamResponse = await fetch(`/api/teams?wallet_address=${address}`);
        const teamResult = await teamResponse.json();
        if (teamResult.success && teamResult.data) {
          setTeamPoints(teamResult.data.total_points || 0);
        }
      } catch (error) {
        console.error('Error loading team players:', error);
      }
    };

    loadTeamPlayers();
  }, [address, nfts]);

  // Load NFTs from collection
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address || !network.apiAddress) return;

      setLoadingNfts(true);
      try {
        const response = await fetch(
          `${network.apiAddress}/accounts/${address}/nfts?collections=${NFT_COLLECTION}&size=100`
        );
        if (response.ok) {
          const data = await response.json();
          setNfts(data || []);
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setLoadingNfts(false);
      }
    };

    fetchNFTs();
  }, [address, network.apiAddress]);

  const handleSelectPlayer = (position: string) => {
    // Only allow selection in transfer mode or when team is not saved
    if (teamSaved && !isTransferMode) return;
    setSelectedPosition(position);
  };

  const handleSelectNft = (nft: NFT) => {
    if (selectedPosition) {
      setSelectedPlayers((prev) => ({
        ...prev,
        [selectedPosition]: nft
      }));
      setSelectedPosition(null);
    }
  };

  const isNftSelected = (nftIdentifier: string) => {
    return Object.values(selectedPlayers).some(
      (player) => player?.identifier === nftIdentifier
    );
  };

  const isAllPositionsFilled = () => {
    return Object.values(selectedPlayers).every((player) => player !== null);
  };

  const getMissingPlayersCount = () => {
    return Object.values(selectedPlayers).filter((player) => player === null).length;
  };

  // Calculate how many players changed
  const getChangedPlayersCount = () => {
    let count = 0;
    Object.keys(selectedPlayers).forEach((position) => {
      const current = selectedPlayers[position]?.identifier;
      const original = originalPlayers[position]?.identifier;
      if (current !== original) {
        count++;
      }
    });
    return count;
  };

  // Calculate transfer cost
  const getTransferCost = () => {
    const changedCount = getChangedPlayersCount();
    return BigInt(changedCount) * BigInt(TRANSFER_COST_PER_PLAYER);
  };


  const handleStartTransfer = () => {
    setIsTransferMode(true);
    setSaveError('');
  };

  const handleCancelTransfer = () => {
    // Reset to original players
    setSelectedPlayers({ ...originalPlayers });
    setIsTransferMode(false);
    setSaveError('');
  };

  const saveTeamToDatabase = useCallback(async () => {
    if (!address || !teamName) return;

    try {
      const players = [
        { position: 'GK', nft_identifier: selectedPlayers.GK?.identifier },
        { position: 'DEF1', nft_identifier: selectedPlayers.DEF1?.identifier },
        { position: 'DEF2', nft_identifier: selectedPlayers.DEF2?.identifier },
        { position: 'ATT1', nft_identifier: selectedPlayers.ATT1?.identifier },
        { position: 'ATT2', nft_identifier: selectedPlayers.ATT2?.identifier },
      ].filter((p): p is { position: string; nft_identifier: string } => !!p.nft_identifier);

      if (players.length !== 5) {
        throw new Error('Please select all 5 players');
      }

      const response = await fetch('/api/teams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          team_name: teamName,
          players
        })
      });

      const result = await response.json();

      if (result.success) {
        setOriginalPlayers({ ...selectedPlayers }); // Update original players
        setTeamSaved(true);
        setIsTransferMode(false);
        setShowSuccessNotification(true);
        setPendingTransferTxHash('');
        setIsSavingTeam(false);
        
        // Load updated team points
        const teamResponse = await fetch(`/api/teams?wallet_address=${address}`);
        const teamResult = await teamResponse.json();
        if (teamResult.success && teamResult.data) {
          setTeamPoints(teamResult.data.total_points || 0);
        }

        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to save team');
      }
    } catch (error: unknown) {
      console.error('Error saving team:', error);
      setSaveError((error as Error)?.message || 'Failed to save team. Please try again.');
      setIsSavingTeam(false);
      setPendingTransferTxHash('');
    }
  }, [address, teamName, selectedPlayers]);

  // Check if pending transfer transaction was successful
  useEffect(() => {
    if (!pendingTransferTxHash || !network.apiAddress) return;

    const isStillPending = pendingTransactions.some(
      (tx) => tx.hash === pendingTransferTxHash
    );
    
    if (!isStillPending) {
      const checkTransactionStatus = async () => {
        try {
          const response = await fetch(
            `${network.apiAddress}/transactions/${pendingTransferTxHash}`
          );
          if (response.ok) {
            const txData = await response.json();
            if (txData.status === 'success' || txData.status === 'executed') {
              // Transaction successful - save team to database
              await saveTeamToDatabase();
            } else {
              // Transaction failed
              setSaveError('Transfer payment failed. Please try again.');
              setIsSavingTeam(false);
              setPendingTransferTxHash('');
            }
          } else {
            setTimeout(() => {
              const stillPending = pendingTransactions.some(
                (tx) => tx.hash === pendingTransferTxHash
              );
              if (!stillPending) {
                checkTransactionStatus();
              }
            }, 2000);
          }
        } catch (error) {
          console.error('Error checking transaction status:', error);
          setTimeout(() => {
            const stillPending = pendingTransactions.some(
              (tx) => tx.hash === pendingTransferTxHash
            );
            if (!stillPending) {
              checkTransactionStatus();
            }
          }, 2000);
        }
      };

      checkTransactionStatus();
    }
  }, [pendingTransactions, pendingTransferTxHash, network.apiAddress, saveTeamToDatabase]);

  const handleSaveTransfer = async () => {
    if (!address || !isAllPositionsFilled() || isSavingTeam) return;

    const changedCount = getChangedPlayersCount();
    if (changedCount === 0) {
      setSaveError('No players changed. Please select different players or cancel.');
      return;
    }

    setIsSavingTeam(true);
    setSaveError('');

    try {
      const transferCost = getTransferCost();

      const transaction = new Transaction({
        value: transferCost,
        receiver: new Address(TRANSFER_RECEIVER),
        gasLimit: BigInt(70000),
        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });

      const { sentTransactions } = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: `Processing transfer payment (${changedCount} player${changedCount !== 1 ? 's' : ''})...`,
          errorMessage: 'Failed to process transfer payment',
          successMessage: 'Transfer payment successful!'
        }
      });

      if (sentTransactions) {
        const txArray = Array.isArray(sentTransactions)
          ? sentTransactions
          : [sentTransactions];
        
        if (txArray.length > 0) {
          const tx = txArray[0];
          const txHash = typeof tx === 'object' && 'hash' in tx ? tx.hash : null;
          if (txHash) {
            setPendingTransferTxHash(txHash);
          } else {
            throw new Error('Transaction failed to send - no hash received');
          }
        } else {
          throw new Error('Transaction failed to send');
        }
      } else {
        throw new Error('Transaction failed to send');
      }
    } catch (error: unknown) {
      console.error('Error processing transfer:', error);
      setSaveError((error as Error)?.message || 'Failed to process transfer. Please try again.');
      setIsSavingTeam(false);
    }
  };

  const handleShareTeam = async () => {
    if (!pitchRef.current) return;
    
    setIsCapturing(true);
    try {
      // Wait for all images to load before capturing
      const images = pitchRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            // Timeout after 5 seconds
            setTimeout(() => resolve(null), 5000);
          });
        })
      );

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // Capture the pitch area with improved settings
      const canvas = await html2canvas(pitchRef.current, {
        backgroundColor: '#0A3124',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: true,
        imageTimeout: 15000,
        removeContainer: false,
        onclone: (clonedDoc) => {
          // Ensure all images in cloned document have proper styling
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach((img) => {
            const imgElement = img as HTMLImageElement;
            imgElement.style.display = 'block';
            imgElement.style.opacity = '1';
            imgElement.style.visibility = 'visible';
            // Ensure images are loaded
            if (!imgElement.complete) {
              imgElement.crossOrigin = 'anonymous';
            }
          });
          
          // Ensure text is visible
          const textElements = clonedDoc.querySelectorAll('p');
          textElements.forEach((p) => {
            const pElement = p as HTMLParagraphElement;
            pElement.style.visibility = 'visible';
            pElement.style.opacity = '1';
            pElement.style.color = '#ffffff';
          });
        }
      });
      
      // Convert canvas to data URL
      const imageUrl = canvas.toDataURL('image/png', 1.0);
      setShareImageUrl(imageUrl);
      setIsCapturing(false);
    } catch (error) {
      console.error('Error capturing team:', error);
      setIsCapturing(false);
    }
  };

  const handleDownloadImage = () => {
    if (!shareImageUrl) return;
    
    const link = document.createElement('a');
    link.download = 'my-afl-team.png';
    link.href = shareImageUrl;
    link.click();
  };

  const handleCloseShareModal = () => {
    if (shareImageUrl) {
      // Clean up the data URL if it was created from blob
      setShareImageUrl(null);
    }
  };

  const handleSaveTeam = async () => {
    if (!address || !isAllPositionsFilled() || isSavingTeam) return;

    // Check if team name exists
    if (!teamName) {
      setSaveError('Please set a team name first');
      return;
    }

    setIsSavingTeam(true);
    setSaveError('');

    try {
      const players = [
        { position: 'GK', nft_identifier: selectedPlayers.GK?.identifier },
        { position: 'DEF1', nft_identifier: selectedPlayers.DEF1?.identifier },
        { position: 'DEF2', nft_identifier: selectedPlayers.DEF2?.identifier },
        { position: 'ATT1', nft_identifier: selectedPlayers.ATT1?.identifier },
        { position: 'ATT2', nft_identifier: selectedPlayers.ATT2?.identifier },
      ].filter((p): p is { position: string; nft_identifier: string } => !!p.nft_identifier);

      if (players.length !== 5) {
        throw new Error('Please select all 5 players');
      }

      const response = await fetch('/api/teams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          team_name: teamName,
          players
        })
      });

      const result = await response.json();

      if (result.success) {
        // Success - team saved
        setSaveError('');
        setTeamSaved(true);
        setShowSuccessNotification(true);
        
        // Load updated team points
        const teamResponse = await fetch(`/api/teams?wallet_address=${address}`);
        const teamResult = await teamResponse.json();
        if (teamResult.success && teamResult.data) {
          setTeamPoints(teamResult.data.total_points || 0);
        }

        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to save team');
      }
    } catch (error: unknown) {
      console.error('Error saving team:', error);
      setSaveError((error as Error)?.message || 'Failed to save team. Please try again.');
    } finally {
      setIsSavingTeam(false);
    }
  };

  const getPlayerImage = (nft: NFT | null) => {
    if (!nft) return null;
    return nft.media?.[0]?.url || nft.media?.[0]?.originalUrl || nft.url || null;
  };

  const PlayerPlaceholder = ({
    position,
    player
  }: {
    position: string;
    player: NFT | null;
  }) => {
    const imageUrl = getPlayerImage(player);
    
    // Get position label based on position key
    const getPositionLabel = (pos: string) => {
      if (pos.startsWith('GK')) return 'Select GK';
      if (pos.startsWith('DEF')) return 'Select DEF';
      if (pos.startsWith('ATT')) return 'Select ATT';
      return 'Select Player';
    };
    
    const playerName = player?.name || getPositionLabel(position);

    return (
      <div className='flex flex-col items-center gap-2'>
      <div
        onClick={() => handleSelectPlayer(position)}
        className={`relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 shadow-lg bg-gray-800/50 flex items-center justify-center ${
          (teamSaved && !isTransferMode) ? 'cursor-default' : 'cursor-pointer hover:border-white/60 hover:scale-110 transition-all'
        }`}
      >
          {imageUrl && !imageErrors.has(player?.identifier || '') ? (
            <img
              src={imageUrl}
              alt={playerName}
              className='w-full h-full object-cover scale-110'
              crossOrigin='anonymous'
              loading='eager'
              onError={() => {
                if (player?.identifier) {
                  setImageErrors((prev) => new Set(prev).add(player.identifier));
                }
              }}
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
        {/* Name outside the circle */}
        <p className='text-[10px] font-semibold text-white text-center max-w-[100px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-1' style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.5)' }}>
          {playerName.length > 12 ? `${playerName.slice(0, 12)}...` : playerName}
        </p>
      </div>
    );
  };

  return (
    <div className='flex flex-col w-full gap-5 pb-6'>
      {/* Football Pitch Container */}
      <div ref={pitchRef} className='relative w-full bg-gradient-to-b from-[#0A3124] to-[#0A3124]/80 rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl'>
        {/* Pitch Background with Image */}
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
              <PlayerPlaceholder position='ATT1' player={selectedPlayers.ATT1} />
              <PlayerPlaceholder position='ATT2' player={selectedPlayers.ATT2} />
            </div>

            {/* Defenders Row (Middle) */}
            <div className='flex justify-center gap-12'>
              <PlayerPlaceholder position='DEF1' player={selectedPlayers.DEF1} />
              <PlayerPlaceholder position='DEF2' player={selectedPlayers.DEF2} />
            </div>

            {/* Goalkeeper (Bottom) */}
            <div className='flex justify-center'>
              <PlayerPlaceholder position='GK' player={selectedPlayers.GK} />
            </div>
          </div>
        </div>
      </div>

      {/* Missing Players Message */}
      {!isAllPositionsFilled() && !teamSaved && (
        <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-6 shadow-2xl border border-gray-800/50'>
          <p className='text-base text-white text-center mb-3'>
            You need <span className='font-bold text-[#3EB489]'>{getMissingPlayersCount()}</span> more player{getMissingPlayersCount() !== 1 ? 's' : ''} to submit your team and start earning points
          </p>
          <p className='text-sm text-gray-400 text-center'>
            Select them or{' '}
              <a
                href='/app/shop'
                className='text-[#3EB489] hover:text-[#8ED6C1] font-semibold underline transition-colors'
              >
                purchase some from here
              </a>
          </p>
        </div>
      )}

      {/* Save Team Button */}
      {isAllPositionsFilled() && !teamSaved && teamName && (
        <button
          onClick={handleSaveTeam}
          disabled={isSavingTeam}
          className='w-full bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSavingTeam ? 'Saving Team...' : 'Save Team'}
        </button>
      )}

      {/* Message if team name is missing */}
      {isAllPositionsFilled() && !teamSaved && !teamName && (
        <div className='w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-semibold py-4 px-6 rounded-2xl text-center'>
          Please set your team name first before saving your team
        </div>
      )}

      {/* Transfer Mode Controls */}
      {teamSaved && !isTransferMode && (
        <div className='flex gap-3'>
          <button
            onClick={handleStartTransfer}
            className='flex-1 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-98'
          >
            Transfer Players
          </button>
          <button
            onClick={handleShareTeam}
            disabled={isCapturing}
            className='bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-500/90 hover:to-blue-600/90 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px]'
            title='Share Team'
          >
            {isCapturing ? (
              <svg className='animate-spin h-5 w-5' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
              </svg>
            ) : (
              <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <circle cx='18' cy='5' r='3'></circle>
                <circle cx='6' cy='12' r='3'></circle>
                <circle cx='18' cy='19' r='3'></circle>
                <line x1='8.59' y1='13.51' x2='15.42' y2='17.49'></line>
                <line x1='15.41' y1='6.51' x2='8.59' y2='10.49'></line>
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Transfer Mode Active - Show Save/Cancel */}
      {isTransferMode && (
        <>
          <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-6 shadow-2xl border border-gray-800/50'>
            <p className='text-base text-white text-center mb-2'>
              Transfer Mode Active
            </p>
            <p className='text-sm text-gray-400 text-center mb-4'>
              {getChangedPlayersCount() > 0 ? (
                <>
                  <span className='font-bold text-[#3EB489]'>{getChangedPlayersCount()}</span> player{getChangedPlayersCount() !== 1 ? 's' : ''} changed
                  <br />
                  Cost: <span className='font-bold text-[#3EB489]'>{(getChangedPlayersCount() * 0.2).toFixed(1)} EGLD</span>
                </>
              ) : (
                'No changes yet. Select players to replace.'
              )}
            </p>
            <div className='flex gap-3'>
              <button
                onClick={handleCancelTransfer}
                disabled={isSavingTeam}
                className='flex-1 px-5 py-3 text-base font-bold bg-gray-700 hover:bg-gray-600 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTransfer}
                disabled={isSavingTeam || getChangedPlayersCount() === 0 || !isAllPositionsFilled()}
                className='flex-1 px-5 py-3 text-base font-bold bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98'
              >
                {isSavingTeam ? 'Processing...' : `Save Transfer (${(getChangedPlayersCount() * 0.2).toFixed(1)} EGLD)`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Total Points Box - Show when team is saved and not in transfer mode */}
      {teamSaved && !isTransferMode && (
        <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-6 shadow-2xl border border-gray-800/50'>
          <div className='flex flex-col items-center gap-2'>
            <p className='text-xs font-medium text-gray-400 uppercase tracking-wider'>Total Points This Season</p>
            <p className='text-3xl font-bold text-[#3EB489]'>{teamPoints.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Save Error */}
      {saveError && (
        <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-6 shadow-2xl border border-red-500/50'>
          <div className='flex items-center gap-3'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={2}
              stroke='currentColor'
              className='w-6 h-6 text-red-400 flex-shrink-0'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
              />
            </svg>
            <p className='text-sm text-red-400 font-medium'>{saveError}</p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className='fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down'>
          <div className='bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 min-w-[300px]'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={2.5}
              stroke='currentColor'
              className='w-6 h-6 flex-shrink-0'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <p className='font-semibold text-base'>Team saved successfully!</p>
          </div>
        </div>
      )}

      {/* NFT Selector Modal */}
      {selectedPosition && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'
          onClick={() => setSelectedPosition(null)}
        >
          <div
            className='relative max-w-2xl w-full max-h-[85vh] bg-gradient-to-br from-gray-900/95 to-black rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl flex flex-col'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-800/50'>
              <h2 className='text-2xl font-bold text-white'>
                Select Player ({selectedPosition})
              </h2>
              <button
                onClick={() => setSelectedPosition(null)}
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

            {/* NFT Grid */}
            <div className='flex-1 overflow-y-auto p-6'>
              {loadingNfts ? (
                <div className='text-center py-12 text-gray-400'>
                  <p className='text-base font-medium'>Loading players...</p>
                </div>
              ) : (() => {
                // Filter NFTs based on selected position
                let filteredNfts = nfts;
                if (selectedPosition) {
                  if (selectedPosition.startsWith('DEF')) {
                    // Filter for defenders - show only NFTs with [DEF] in name
                    filteredNfts = nfts.filter((nft) => 
                      (nft.name || nft.identifier).toUpperCase().includes('[DEF]')
                    );
                  } else if (selectedPosition.startsWith('ATT')) {
                    // Filter for attackers - show only NFTs with [ATT] in name
                    filteredNfts = nfts.filter((nft) => 
                      (nft.name || nft.identifier).toUpperCase().includes('[ATT]')
                    );
                  } else if (selectedPosition === 'GK') {
                    // Filter for goalkeepers - show only NFTs with [GK] in name
                    filteredNfts = nfts.filter((nft) => 
                      (nft.name || nft.identifier).toUpperCase().includes('[GK]')
                    );
                  }
                }
                
                return filteredNfts.length > 0 ? (
                  <div className='grid grid-cols-2 gap-4'>
                    {filteredNfts.map((nft) => {
                    const imageUrl =
                      nft.media?.[0]?.url ||
                      nft.media?.[0]?.originalUrl ||
                      nft.url ||
                      '';
                    const isSelected =
                      selectedPlayers[selectedPosition]?.identifier === nft.identifier;
                    const isAlreadySelected = isNftSelected(nft.identifier) && !isSelected;

                    return (
                      <div
                        key={nft.identifier}
                        onClick={() => !isAlreadySelected && handleSelectNft(nft)}
                        className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden transition-all ${
                          isAlreadySelected
                            ? 'opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'ring-4 ring-[#3EB489] ring-offset-2 ring-offset-gray-900 cursor-pointer'
                            : 'hover:opacity-90 hover:scale-105 cursor-pointer'
                        }`}
                      >
                        {imageUrl && !imageErrors.has(nft.identifier) ? (
                          <>
                            <img
                              src={imageUrl}
                              alt={nft.name}
                              className='w-full h-full object-cover'
                            />
                            {/* Gradient overlay */}
                            <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/50 to-transparent'></div>
                            {/* Name overlay */}
                            <div className='absolute bottom-0 left-0 right-0 px-4 pb-4'>
                              <p className='text-xs font-semibold text-white text-center drop-shadow-lg'>
                                {nft.name || nft.identifier}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className='w-full h-full bg-gray-800/50 flex flex-col items-center justify-center relative'>
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              fill='none'
                              viewBox='0 0 24 24'
                              strokeWidth={1.5}
                              stroke='currentColor'
                              className='w-16 h-16 text-gray-600'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
                              />
                            </svg>
                            {/* Gradient overlay */}
                            <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/50 to-transparent'></div>
                            {/* Name overlay */}
                            <div className='absolute bottom-0 left-0 right-0 px-4 pb-4'>
                              <p className='text-xs font-semibold text-white text-center drop-shadow-lg'>
                                {nft.name || nft.identifier}
                              </p>
                            </div>
                          </div>
                        )}
                        {isSelected && (
                          <div className='absolute top-2 right-2 w-6 h-6 bg-[#3EB489] rounded-full flex items-center justify-center'>
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              fill='none'
                              viewBox='0 0 24 24'
                              strokeWidth={3}
                              stroke='white'
                              className='w-4 h-4'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M4.5 12.75l6 6 9-13.5'
                              />
                            </svg>
                          </div>
                        )}
                        {isAlreadySelected && (
                          <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
                            <div className='bg-gray-800/90 px-3 py-1 rounded-lg'>
                              <p className='text-xs font-semibold text-white'>Already Selected</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                ) : (
                  <div className='text-center py-12 text-gray-400'>
                    <p className='text-base font-medium'>
                      No {selectedPosition?.startsWith('DEF') ? 'defenders' : selectedPosition?.startsWith('ATT') ? 'attackers' : selectedPosition === 'GK' ? 'goalkeepers' : 'players'} available
                    </p>
                    <p className='text-sm mt-2 text-gray-500'>
                      Purchase players with [{selectedPosition?.startsWith('DEF') ? 'DEF' : selectedPosition?.startsWith('ATT') ? 'ATT' : selectedPosition === 'GK' ? 'GK' : ''}] to build your team!
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Share Team Image Modal */}
      {shareImageUrl && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm'
          onClick={handleCloseShareModal}
        >
          <div
            className='relative max-w-2xl w-full bg-gradient-to-br from-gray-900/95 to-black rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl flex flex-col'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-800/50'>
              <h2 className='text-2xl font-bold text-white'>
                Your Team
              </h2>
              <button
                onClick={handleCloseShareModal}
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

            {/* Image Display */}
            <div className='flex-1 overflow-y-auto p-6 flex items-center justify-center'>
              <div className='relative w-full max-w-md'>
                <img
                  src={shareImageUrl}
                  alt='My AFL Team'
                  className='w-full h-auto rounded-xl shadow-2xl'
                />
              </div>
            </div>

            {/* Download Button */}
            <div className='p-6 border-t border-gray-800/50'>
              <button
                onClick={handleDownloadImage}
                className='w-full bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2'
              >
                <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                  <polyline points='7 10 12 15 17 10'></polyline>
                  <line x1='12' y1='15' x2='12' y2='3'></line>
                </svg>
                Download Image
              </button>
              <p className='text-sm text-white/60 text-center mt-3'>
                Save the image and share it on your favorite platform!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
