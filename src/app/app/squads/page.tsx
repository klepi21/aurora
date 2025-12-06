'use client';
import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import {
  useGetAccountInfo,
  useGetNetworkConfig,
  Transaction,
  Address,
  useGetPendingTransactions
} from '@/lib';
import { signAndSendTransactions } from '@/helpers/signAndSendTransactions';
import { GAS_PRICE } from '@/localConstants';
import { useToastContext } from '@/components/Toast';
import { getDynamicCosts } from '@/utils/egldPrice';
import Image from 'next/image';
import pitchImage from '../../../../public/assets/img/pitch.png';

const NFT_COLLECTION = 'AFL-6cefed';
const TRANSFER_RECEIVER = 'erd1pfzzs89g0qsx3hlqkzf2p8unh37932g4cv6ftd869ddv8awwng5q09vlpy';

interface NFT {
  identifier: string;
  name: string;
  media: Array<{ url: string; originalUrl: string }>;
  url: string;
}


export default function SquadsPage() {
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();
  const { success, error: showError } = useToastContext();
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
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  const [transferCostPerPlayer, setTransferCostPerPlayer] = useState<string>('200000000000000000'); // Fallback: 0.2 EGLD
  const [countdown, setCountdown] = useState<string>('');
  const [closingCountdown, setClosingCountdown] = useState<string>('');

  // Calculate countdown to next substitute window
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const utcDay = now.getUTCDay();
      const utcHour = now.getUTCHours();
      const utcMinute = now.getUTCMinutes();
      const utcSecond = now.getUTCSeconds();

      let nextWindow: Date;

      // If it's Tuesday or Friday but before 9 AM UTC, next window is today at 9 AM
      if ((utcDay === 2 || utcDay === 5) && utcHour < 9) {
        nextWindow = new Date(now);
        nextWindow.setUTCHours(9, 0, 0, 0);
      }
      // If it's Tuesday or Friday but after 3 PM UTC, calculate next window
      else if ((utcDay === 2 || utcDay === 5) && utcHour >= 15) {
        // If Tuesday, next is Friday
        if (utcDay === 2) {
          const daysUntilFriday = 3;
          nextWindow = new Date(now);
          nextWindow.setUTCDate(now.getUTCDate() + daysUntilFriday);
          nextWindow.setUTCHours(9, 0, 0, 0);
        } else {
          // If Friday, next is Tuesday (4 days)
          const daysUntilTuesday = 4;
          nextWindow = new Date(now);
          nextWindow.setUTCDate(now.getUTCDate() + daysUntilTuesday);
          nextWindow.setUTCHours(9, 0, 0, 0);
        }
      }
      // Otherwise, calculate next Tuesday or Friday (whichever is sooner)
      else {
        const nextTuesday = new Date(now);
        const daysUntilTuesday = (2 - utcDay + 7) % 7 || 7;
        nextTuesday.setUTCDate(now.getUTCDate() + daysUntilTuesday);
        nextTuesday.setUTCHours(9, 0, 0, 0);

        const nextFriday = new Date(now);
        const daysUntilFriday = (5 - utcDay + 7) % 7 || 7;
        nextFriday.setUTCDate(now.getUTCDate() + daysUntilFriday);
        nextFriday.setUTCHours(9, 0, 0, 0);

        nextWindow = nextTuesday < nextFriday ? nextTuesday : nextFriday;
      }

      // Calculate time difference
      const diff = nextWindow.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown('Substitutes are now open!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let countdownStr = '';
      if (days > 0) {
        countdownStr += `${days}d `;
      }
      if (hours > 0 || days > 0) {
        countdownStr += `${hours}h `;
      }
      if (minutes > 0 || hours > 0 || days > 0) {
        countdownStr += `${minutes}m `;
      }
      countdownStr += `${seconds}s`;

      setCountdown(countdownStr.trim());
    };

    // Calculate countdown to when current window closes (if window is open)
    const calculateClosingCountdown = () => {
      const now = new Date();
      const utcDay = now.getUTCDay();
      const utcHour = now.getUTCHours();
      const utcMinute = now.getUTCMinutes();
      const utcSecond = now.getUTCSeconds();

      // Check if we're in a substitute window (Tuesday or Friday, 9-15 UTC)
      if ((utcDay === 2 || utcDay === 5) && utcHour >= 9 && utcHour < 15) {
        // Window is open - calculate time until 15:00 UTC
        const closingTime = new Date(now);
        closingTime.setUTCHours(15, 0, 0, 0);
        
        const diff = closingTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setClosingCountdown('Substitutes closing now!');
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const closingCountdownStr = `${hours}h ${minutes}m ${seconds}s`;
        setClosingCountdown(closingCountdownStr);
      } else {
        setClosingCountdown('');
      }
    };

    // Calculate immediately
    calculateCountdown();
    calculateClosingCountdown();

    // Update every second
    const interval = setInterval(() => {
      calculateCountdown();
      calculateClosingCountdown();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch dynamic transfer cost on mount
  useEffect(() => {
    const loadTransferCost = async () => {
      try {
        const costs = await getDynamicCosts();
        setTransferCostPerPlayer(costs.transferPerPlayer);
      } catch (error) {
        console.error('Error loading transfer cost:', error);
        // Keep fallback value
      }
    };
    loadTransferCost();
  }, []);

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

          // Match NFT identifiers with loaded NFTs and store points
          const pointsMap: Record<string, number> = {};
          teamPlayersResult.data.forEach((player: { position: string; player_nft_identifier: string; points?: number }) => {
            const matchedNft = nfts.find((nft) => nft.identifier === player.player_nft_identifier);
            if (matchedNft) {
              players[player.position] = matchedNft;
              if (player.points !== undefined) {
                pointsMap[player.player_nft_identifier] = player.points;
              }
            }
          });

          setSelectedPlayers(players);
          setOriginalPlayers({ ...players }); // Store original for comparison
          setPlayerPoints(pointsMap);
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

  // Format EGLD amount for display (from wei to readable format, rounded to 2 decimals)
  const formatEgldAmount = (weiAmount: string): string => {
    const amount = BigInt(weiAmount);
    const divisor = BigInt('1000000000000000000'); // 1 EGLD = 10^18
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;
    const fractionalStr = fractionalPart.toString().padStart(18, '0');
    const decimalPart = fractionalStr.slice(0, 2);
    return `${wholePart.toString()}.${decimalPart}`;
  };

  // Calculate transfer cost
  const getTransferCost = () => {
    const changedCount = getChangedPlayersCount();
    return BigInt(changedCount) * BigInt(transferCostPerPlayer);
  };

  // Check if substitutes are currently available (Tuesdays and Fridays, 09:00-15:00 UTC)
  const isSubstituteWindowOpen = () => {
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
    const utcHour = now.getUTCHours();
    
    // Tuesday = 2, Friday = 5
    const isAllowedDay = utcDay === 2 || utcDay === 5;
    const isAllowedTime = utcHour >= 9 && utcHour < 15;
    
    return isAllowedDay && isAllowedTime;
  };

  // Get next available substitute window message
  const getSubstituteWindowMessage = () => {
    const now = new Date();
    const utcDay = now.getUTCDay();
    const utcHour = now.getUTCHours();
    
    // Calculate next Tuesday
    const nextTuesday = new Date(now);
    const daysUntilTuesday = (2 - utcDay + 7) % 7 || 7;
    nextTuesday.setUTCDate(now.getUTCDate() + daysUntilTuesday);
    nextTuesday.setUTCHours(9, 0, 0, 0);
    
    // Calculate next Friday
    const nextFriday = new Date(now);
    const daysUntilFriday = (5 - utcDay + 7) % 7 || 7;
    nextFriday.setUTCDate(now.getUTCDate() + daysUntilFriday);
    nextFriday.setUTCHours(9, 0, 0, 0);
    
    // If it's Tuesday or Friday but outside hours, show today's window
    if ((utcDay === 2 || utcDay === 5) && utcHour < 9) {
      const todayWindow = new Date(now);
      todayWindow.setUTCHours(9, 0, 0, 0);
      return `Substitutes open today at ${todayWindow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;
    }
    
    // If it's Tuesday but after hours, show next Friday
    if (utcDay === 2 && utcHour >= 15) {
      return `Substitutes open next Friday at ${nextFriday.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;
    }
    
    // If it's Friday but after hours, show next Tuesday
    if (utcDay === 5 && utcHour >= 15) {
      return `Substitutes open next Tuesday at ${nextTuesday.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;
    }
    
    // Otherwise, show the next available window (Tuesday or Friday, whichever is sooner)
    const nextWindow = nextTuesday < nextFriday ? nextTuesday : nextFriday;
    const dayName = nextWindow.getUTCDay() === 2 ? 'Tuesday' : 'Friday';
    return `Substitutes open next ${dayName} at ${nextWindow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;
  };


  const handleStartTransfer = () => {
    // Check if substitute window is open
    if (!isSubstituteWindowOpen()) {
      showError('Substitutes are only available on Tuesdays and Fridays from 09:00-15:00 UTC', 5000);
      return;
    }
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
        setSaveError(''); // Clear any previous errors
        
        const changedCount = getChangedPlayersCount();
        if (changedCount > 0) {
          success(`Substitutes completed! ${changedCount} player${changedCount !== 1 ? 's' : ''} updated.`, 4000);
        } else {
          success('Team saved successfully!', 4000);
        }
        
        // Load updated team points and player points
        const teamResponse = await fetch(`/api/teams?wallet_address=${address}`);
        const teamResult = await teamResponse.json();
        if (teamResult.success && teamResult.data) {
          setTeamPoints(teamResult.data.total_points || 0);
        }

        // Fetch player points
        const playersResponse = await fetch(`/api/teams/players?wallet_address=${address}`);
        const playersResult = await playersResponse.json();
        if (playersResult.success && playersResult.data) {
          const pointsMap: Record<string, number> = {};
          playersResult.data.forEach((player: { player_nft_identifier: string; points?: number }) => {
            if (player.points !== undefined) {
              pointsMap[player.player_nft_identifier] = player.points;
            }
          });
          setPlayerPoints(pointsMap);
        }

        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to save team');
      }
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || 'Failed to save team. Please try again.';
      setSaveError(errorMessage);
      showError(errorMessage, 4000);
      setIsSavingTeam(false);
      setPendingTransferTxHash('');
    }
  }, [address, teamName, selectedPlayers, success, showError]);

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
              const errorMsg = 'Substitute payment failed. Please try again.';
              setSaveError(errorMsg);
              showError(errorMsg, 4000);
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
    
    // Check if substitute window is open
    if (!isSubstituteWindowOpen()) {
      showError('Substitutes are only available on Tuesdays and Fridays from 09:00-15:00 UTC', 5000);
      return;
    }

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
          processingMessage: `Processing substitute payment (${changedCount} player${changedCount !== 1 ? 's' : ''})...`,
          errorMessage: 'Failed to process substitute payment',
          successMessage: 'Substitute payment successful!'
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
      console.error('Error processing substitute:', error);
      setSaveError((error as Error)?.message || 'Failed to process substitute. Please try again.');
      setIsSavingTeam(false);
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
        
        success('Team saved successfully!', 4000);
        
        // Load updated team points and player points
        const teamResponse = await fetch(`/api/teams?wallet_address=${address}`);
        const teamResult = await teamResponse.json();
        if (teamResult.success && teamResult.data) {
          setTeamPoints(teamResult.data.total_points || 0);
        }

        // Fetch player points
        const playersResponse = await fetch(`/api/teams/players?wallet_address=${address}`);
        const playersResult = await playersResponse.json();
        if (playersResult.success && playersResult.data) {
          const pointsMap: Record<string, number> = {};
          playersResult.data.forEach((player: { player_nft_identifier: string; points?: number }) => {
            if (player.points !== undefined) {
              pointsMap[player.player_nft_identifier] = player.points;
            }
          });
          setPlayerPoints(pointsMap);
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
    if (!nft || !nft.identifier) return null;
    
    // Try NFT media URLs first (usually faster), then fallback to MultiversX API
    return nft.media?.[0]?.url || 
           nft.media?.[0]?.originalUrl || 
           nft.url || 
           `https://media.multiversx.com/nfts/thumbnail/${nft.identifier}`;
  };

  const PlayerPlaceholder = memo(({
    position,
    player
  }: {
    position: string;
    player: NFT | null;
  }) => {
    const playerPointsValue = player?.identifier ? playerPoints[player.identifier] : undefined;
    const [imageError, setImageError] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    
    // Get position label based on position key
    const getPositionLabel = (pos: string) => {
      if (pos.startsWith('GK')) return 'Select GK';
      if (pos.startsWith('DEF')) return 'Select DEF';
      if (pos.startsWith('ATT')) return 'Select ATT';
      return 'Select Player';
    };
    
    const playerName = player?.name || getPositionLabel(position);

    // Get all possible image sources and try them in order with delay
    // Use identifier as dependency to prevent unnecessary rerenders
    const playerIdentifier = player?.identifier;
    useEffect(() => {
      if (!player || !playerIdentifier) {
        setImageSrc(null);
        setImageError(false);
        return;
      }

      // Try NFT media URLs first, then fallback to MultiversX API
      const imageUrl = player.media?.[0]?.url || 
                       player.media?.[0]?.originalUrl || 
                       player.url || 
                       `https://media.multiversx.com/nfts/thumbnail/${playerIdentifier}`;
      setImageSrc(imageUrl);
      setImageError(false);
    }, [playerIdentifier, player]);

    const handleImageError = () => {
      if (!player || !player.identifier) return;
      
      // Mark as error and add to error set
      setImageError(true);
      setImageErrors((prev) => new Set(prev).add(player.identifier));
    };

    return (
      <div className='flex flex-col items-center gap-2'>
      <div
        onClick={() => handleSelectPlayer(position)}
        className={`relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 shadow-lg bg-gray-800/50 flex items-center justify-center ${
          (teamSaved && !isTransferMode) ? 'cursor-default' : 'cursor-pointer hover:border-white/60 hover:scale-110 transition-all'
        }`}
      >
          {imageSrc && !imageError && !imageErrors.has(player?.identifier || '') ? (
            <img
              key={imageSrc}
              src={imageSrc}
              alt={playerName}
              className='w-full h-full object-cover scale-110'
              loading='lazy'
              onError={handleImageError}
              onLoad={() => setImageError(false)}
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
        <div className='flex flex-col items-center gap-0.5'>
          <p className='text-[10px] font-semibold text-white text-center max-w-[100px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-1' style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.5)' }}>
            {playerName.length > 12 ? `${playerName.slice(0, 12)}...` : playerName}
          </p>
          {/* Show points when team is saved */}
          {teamSaved && player && playerPointsValue !== undefined && (
            <p className='text-[9px] font-bold text-[#3EB489] text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              {playerPointsValue} P
            </p>
          )}
        </div>
      </div>
    );
  });

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

      {/* Substitute Mode Controls */}
      {teamSaved && !isTransferMode && (
        <div className='flex flex-col gap-3'>
          {!isSubstituteWindowOpen() && (
            <div className='bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-4'>
              <p className='text-yellow-200 text-sm text-center font-medium mb-2'>
                ⏰ Substitutes are only available on Tuesdays and Fridays from 09:00-15:00 UTC
              </p>
              <p className='text-yellow-300/80 text-xs text-center mb-2'>
                {getSubstituteWindowMessage()}
              </p>
              {countdown && (
                <div className='mt-3 pt-3 border-t border-yellow-500/30'>
                  <p className='text-yellow-200 text-xs text-center font-medium mb-1'>
                    Opens in:
                  </p>
                  <p className='text-yellow-300 text-lg text-center font-bold tracking-wider'>
                    {countdown}
                  </p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleStartTransfer}
            disabled={!isSubstituteWindowOpen()}
            className={`flex-1 font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-98 ${
              isSubstituteWindowOpen()
                ? 'bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
            }`}
          >
            Make Substitutes
          </button>
        </div>
      )}

      {/* Substitute Mode Active - Show Save/Cancel */}
      {isTransferMode && (
        <>
          <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-6 shadow-2xl border border-gray-800/50'>
            <p className='text-base text-white text-center mb-2'>
              Substitute Mode Active
            </p>
            {closingCountdown && (
              <div className='bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 mb-4'>
                <p className='text-yellow-200 text-xs text-center font-medium mb-1'>
                  ⏰ Substitutes close in:
                </p>
                <p className='text-yellow-300 text-lg text-center font-bold tracking-wider'>
                  {closingCountdown}
                </p>
              </div>
            )}
            <p className='text-sm text-gray-400 text-center mb-4'>
              {getChangedPlayersCount() > 0 ? (
                <>
                  <span className='font-bold text-[#3EB489]'>{getChangedPlayersCount()}</span> player{getChangedPlayersCount() !== 1 ? 's' : ''} changed
                  <br />
                  Cost: <span className='font-bold text-[#3EB489]'>{formatEgldAmount((BigInt(getChangedPlayersCount()) * BigInt(transferCostPerPlayer)).toString())} EGLD</span>
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
                {isSavingTeam ? 'Processing...' : `Save Substitutes (${formatEgldAmount((BigInt(getChangedPlayersCount()) * BigInt(transferCostPerPlayer)).toString())} EGLD)`}
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
                    // Try NFT media URLs first, then fallback to MultiversX API
                    const imageUrl = nft.media?.[0]?.url || 
                                    nft.media?.[0]?.originalUrl || 
                                    nft.url || 
                                    (nft.identifier ? `https://media.multiversx.com/nfts/thumbnail/${nft.identifier}` : '');
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
                              loading='lazy'
                              onError={() => {
                                if (nft.identifier) {
                                  setImageErrors((prev) => new Set(prev).add(nft.identifier));
                                }
                              }}
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

    </div>
  );
}
