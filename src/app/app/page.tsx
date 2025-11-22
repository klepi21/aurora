'use client';
import { useState, useEffect } from 'react';
import {
  useGetAccountInfo,
  useGetNetworkConfig,
  FormatAmountController,
  DIGITS,
  DECIMALS,
  getExplorerLink,
  Transaction,
  Address,
  useGetPendingTransactions
} from '@/lib';
import { Button } from '@/components/Button';
import { ACCOUNTS_ENDPOINT, GAS_PRICE } from '@/localConstants';
import { signAndSendTransactions } from '@/helpers/signAndSendTransactions';
import Image from 'next/image';

const NFT_COLLECTION = 'FOOT-9e4e8c';
const TEAM_NAME_RECEIVER = 'erd1u5p4njlv9rxvzvmhsxjypa69t2dran33x9ttpx0ghft7tt35wpfsxgynw4';
const TEAM_NAME_CREATE_AMOUNT = '100000000000000000'; // 0.1 EGLD
const TEAM_NAME_EDIT_AMOUNT = '1000000000000000000'; // 1 EGLD

interface NFT {
  identifier: string;
  name: string;
  media: Array<{ url: string; originalUrl: string }>;
  url: string;
}

export default function App() {
  const { address, account } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();
  const [teamName, setTeamName] = useState<string>('');
  const [teamNameInput, setTeamNameInput] = useState('');
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [teamRanking, setTeamRanking] = useState<number | null>(null);
  const [teamPoints, setTeamPoints] = useState<number>(0);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
  const [teamSubmitError, setTeamSubmitError] = useState<string>('');
  const [pendingTxHash, setPendingTxHash] = useState<string>('');
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const pendingTransactions = useGetPendingTransactions();

  // Reset team name when address changes (user connects/disconnects)
  useEffect(() => {
    setTeamName('');
    setTeamNameInput('');
    setTeamSubmitError('');
    setPendingTxHash('');
    setTeamRanking(null);
    setTeamPoints(0);
    setIsEditingTeamName(false);
  }, [address]);

  // Load team name, ranking, and points from database
  useEffect(() => {
    const loadTeamData = async () => {
      if (!address) return;

      try {
        // Load team data
        const response = await fetch(`/api/teams?wallet_address=${address}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          if (result.data.team_name) {
            setTeamName(result.data.team_name);
          }
          if (result.data.total_points !== undefined) {
            setTeamPoints(result.data.total_points || 0);
          }
          if (result.data.rank !== undefined) {
            setTeamRanking(result.data.rank);
          }
        }
      } catch (error) {
        console.error('Error loading team data:', error);
      }
    };

    loadTeamData();
  }, [address]);

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

  // Check if pending transaction was successful
  useEffect(() => {
    if (pendingTxHash && teamNameInput.trim()) {
      // Check if transaction is no longer in pending list
      const isStillPending = pendingTransactions.some(
        (tx) => tx.hash === pendingTxHash
      );
      
      if (!isStillPending) {
        // Transaction is no longer pending - check if it was successful
        // We'll verify by checking the transaction status on the network
        const checkTransactionStatus = async () => {
          try {
            const response = await fetch(
              `${network.apiAddress}/transactions/${pendingTxHash}`
            );
            if (response.ok) {
              const txData = await response.json();
              if (txData.status === 'success' || txData.status === 'executed') {
                // Transaction successful - save to database
                try {
                  const saveResponse = await fetch('/api/teams', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      wallet_address: address,
                      team_name: teamNameInput.trim()
                    })
                  });

                  const saveResult = await saveResponse.json();
                  if (saveResult.success) {
                    setTeamName(teamNameInput.trim());
                    setTeamNameInput('');
                    setIsEditingTeamName(false);
                    setPendingTxHash('');
                    setIsSubmittingTeam(false);
                    setTeamSubmitError('');
                    
                    // Refresh team data to get updated ranking and points
                    const refreshResponse = await fetch(`/api/teams?wallet_address=${address}`);
                    const refreshResult = await refreshResponse.json();
                    if (refreshResult.success && refreshResult.data) {
                      if (refreshResult.data.total_points !== undefined) {
                        setTeamPoints(refreshResult.data.total_points || 0);
                      }
                      if (refreshResult.data.rank !== undefined) {
                        setTeamRanking(refreshResult.data.rank);
                      }
                    }
                  } else {
                    throw new Error(saveResult.error || 'Failed to save team name');
                  }
                } catch (dbError: unknown) {
                  console.error('Error saving team name to database:', dbError);
                  setTeamSubmitError((dbError as Error)?.message || 'Transaction succeeded but failed to save team name. Please try again.');
                  setIsSubmittingTeam(false);
                  setPendingTxHash('');
                }
              } else {
                // Transaction failed
                setTeamSubmitError('Transaction failed. Please try again.');
                setIsSubmittingTeam(false);
                setPendingTxHash('');
              }
            } else {
              // Couldn't fetch transaction - might still be processing
              // Wait a bit and check again
              setTimeout(() => {
                const stillPending = pendingTransactions.some(
                  (tx) => tx.hash === pendingTxHash
                );
                if (!stillPending) {
                  checkTransactionStatus();
                }
              }, 2000);
            }
          } catch (error) {
            console.error('Error checking transaction status:', error);
            // On error, assume it might still be processing
            setTimeout(() => {
              const stillPending = pendingTransactions.some(
                (tx) => tx.hash === pendingTxHash
              );
              if (!stillPending) {
                checkTransactionStatus();
              }
            }, 2000);
          }
        };

        checkTransactionStatus();
      }
    }
  }, [pendingTransactions, pendingTxHash, teamNameInput, address, network.apiAddress]);

  // Calculate required amount based on create/edit mode
  const getRequiredAmount = () => {
    return isEditingTeamName ? TEAM_NAME_EDIT_AMOUNT : TEAM_NAME_CREATE_AMOUNT;
  };

  // Check if balance is sufficient
  const hasSufficientBalance = () => {
    if (!account?.balance) return false;
    const balance = BigInt(account.balance);
    const required = BigInt(getRequiredAmount());
    const gasCost = BigInt(70000) * BigInt(GAS_PRICE);
    return balance >= (required + gasCost);
  };

  const handleEditTeamName = () => {
    setIsEditingTeamName(true);
    setTeamNameInput(teamName);
    setTeamSubmitError('');
  };

  const handleCancelEdit = () => {
    setIsEditingTeamName(false);
    setTeamNameInput('');
    setTeamSubmitError('');
  };

  const handleSaveTeamName = async () => {
    if (!address || !teamNameInput.trim() || isSubmittingTeam) return;

    // Check balance before submitting
    if (!hasSufficientBalance()) {
      const amount = isEditingTeamName ? '1 EGLD' : '0.1 EGLD';
      setTeamSubmitError(`Insufficient balance. You need at least ${amount} to ${isEditingTeamName ? 'edit' : 'create'} your team name.`);
      return;
    }

    setIsSubmittingTeam(true);
    setTeamSubmitError('');

    try {
      const requiredAmount = getRequiredAmount();
      const transaction = new Transaction({
        value: BigInt(requiredAmount),
        receiver: new Address(TEAM_NAME_RECEIVER),
        gasLimit: BigInt(70000),
        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });

      const { sentTransactions } = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: isEditingTeamName ? 'Updating team name...' : 'Submitting team name...',
          errorMessage: isEditingTeamName ? 'Failed to update team name' : 'Failed to submit team name',
          successMessage: isEditingTeamName ? 'Team name updated successfully!' : 'Team name submitted successfully!'
        }
      });

      if (sentTransactions) {
        // sentTransactions can be an array or a single transaction
        const txArray = Array.isArray(sentTransactions)
          ? sentTransactions
          : [sentTransactions];
        
        if (txArray.length > 0) {
          const tx = txArray[0];
          // Get hash from the transaction
          const txHash = typeof tx === 'object' && 'hash' in tx ? tx.hash : null;
          if (txHash) {
            setPendingTxHash(txHash);
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
      console.error('Error submitting team name:', error);
      setTeamSubmitError((error as Error)?.message || 'Failed to submit team name. Please try again.');
      setIsSubmittingTeam(false);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return 'N/A';
    return `${addr.slice(0, 4)}...${addr.slice(-2)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const explorerLink = address
    ? getExplorerLink({
        to: `/${ACCOUNTS_ENDPOINT}/${address}`,
        explorerAddress: network.explorerAddress
      })
    : '';

  const { valueDecimal, valueInteger } =
    FormatAmountController.getData({
      digits: DIGITS,
      decimals: DECIMALS,
      egldLabel: network.egldLabel,
      input: account?.balance || '0'
    });


  return (
    <div className='flex flex-col w-full gap-5'>
      {/* Aurora Image Box */}
      <div className='relative bg-gradient-to-br from-gray-900/95 to-black rounded-2xl shadow-xl border border-gray-800/50 backdrop-blur-sm overflow-hidden'>
        <div className='relative w-full h-24'>
          <Image
            src='/assets/img/aurora.png'
            alt='Aurora'
            fill
            className='object-cover'
          />
          {/* Text Overlay */}
          <div className='absolute left-0 top-0 h-full flex flex-col justify-center pl-6 z-10'>
            <p className='text-2xl font-bold text-white mb-1'>AFL Season 1</p>
            <p className='text-sm font-semibold text-[#3EB489]'>Coming Soon</p>
          </div>
        </div>
      </div>

      {/* Wallet Info Cards - Two Smaller Boxes */}
      <div className='grid grid-cols-2 gap-4'>
        {/* Balance Card */}
        <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-4 shadow-xl border border-gray-800/50 backdrop-blur-sm'>
          <div className='flex flex-col gap-1.5'>
            <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>Balance</p>
            <div className='flex items-center gap-2'>
              <span className='text-base font-bold text-white'>
                {(() => {
                  const integer = valueInteger.replace(/\.$/, '');
                  const decimal = valueDecimal?.replace(/^\./, '') || '';
                  return decimal ? `${integer}.${decimal}` : integer;
                })()}
              </span>
              <img
                src='https://s2.coinmarketcap.com/static/img/coins/200x200/6892.png'
                alt='EGLD'
                className='w-6 h-6'
              />
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-4 shadow-xl border border-gray-800/50 backdrop-blur-sm'>
          <div className='flex flex-col gap-1.5'>
            <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>Wallet Address</p>
            <div className='flex items-center gap-1.5'>
              <p className='text-xs font-mono font-semibold text-white truncate max-w-[80px]'>
                {formatAddress(address || '')}
              </p>
              <button
                onClick={() => copyToClipboard(address || '')}
                className='p-1.5 hover:bg-[#3EB489]/20 rounded-lg transition-all active:scale-95 flex-shrink-0'
                title='Copy address'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='#3EB489'
                  className='w-4 h-4'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184'
                  />
                </svg>
              </button>
              <a
                href={explorerLink}
                target='_blank'
                rel='noopener noreferrer'
                className='p-1.5 hover:bg-[#3EB489]/20 rounded-lg transition-all active:scale-95 flex-shrink-0'
                title='View on explorer'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='#3EB489'
                  className='w-4 h-4'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25'
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Team Name Section */}
      <div className='relative bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-6 shadow-2xl border border-gray-800/50 overflow-hidden'>
        {/* Background Image */}
        <div className='absolute top-0 -right-16 w-64 h-full opacity-100'>
          <Image
            src='/assets/img/yamala.png'
            alt='Yamala'
            fill
            className='object-contain object-right'
          />
        </div>
        <div className='relative flex flex-col gap-4 z-10'>
          <p className='text-xs font-medium text-gray-400 uppercase tracking-wider'>My Team</p>
          {!teamName || isEditingTeamName ? (
            <div className='flex flex-col gap-4'>
              <p className='text-sm text-gray-400'>
                {isEditingTeamName ? 'Edit your team name' : "You don't have a team yet. Create now!"}
              </p>
              <div className='flex flex-col gap-3'>
                <input
                  type='text'
                  value={teamNameInput}
                  onChange={(e) => {
                    setTeamNameInput(e.target.value);
                    setTeamSubmitError('');
                  }}
                  placeholder='Enter your team name'
                  disabled={isSubmittingTeam}
                  className='px-5 py-4 bg-gray-800/50 border border-gray-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3EB489]/50 focus:border-[#3EB489] text-white placeholder:text-gray-500 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                  autoFocus
                />
                {teamSubmitError && (
                  <div className='px-4 py-3 bg-red-500/20 border border-red-500/50 rounded-xl'>
                    <p className='text-sm text-red-400 font-medium'>{teamSubmitError}</p>
                  </div>
                )}
                <div className='flex gap-3'>
                  {isEditingTeamName && (
                    <Button
                      onClick={handleCancelEdit}
                      disabled={isSubmittingTeam}
                      className='flex-1 px-5 py-4 text-base font-bold bg-gray-700 hover:bg-gray-600 text-white rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98'
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveTeamName}
                    disabled={!teamNameInput.trim() || isSubmittingTeam || !hasSufficientBalance()}
                    className={`${isEditingTeamName ? 'flex-1' : 'w-full'} px-5 py-4 text-base font-bold bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-white rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98`}
                  >
                    {isSubmittingTeam 
                      ? (isEditingTeamName ? 'Updating...' : 'Submitting...') 
                      : isEditingTeamName 
                        ? `Update Team (1 EGLD)` 
                        : 'Create Team (0.1 EGLD)'}
                  </Button>
                </div>
                {!hasSufficientBalance() && (
                  <p className='text-xs text-red-400 text-center'>
                    Insufficient balance. You need at least {isEditingTeamName ? '1 EGLD' : '0.1 EGLD'} to {isEditingTeamName ? 'edit' : 'create'} your team name.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-4'>
              <div className='flex items-center gap-2'>
                <p className='text-2xl font-bold text-[#3EB489]'>{teamName}</p>
                <button
                  onClick={handleEditTeamName}
                  disabled={!hasSufficientBalance()}
                  className='px-3 py-1 text-xs font-semibold bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all active:scale-95'
                  title={!hasSufficientBalance() ? 'Insufficient balance (need 1 EGLD)' : 'Edit team name'}
                >
                  Edit
                </button>
              </div>
              
              {/* Divider */}
              <div className='border-t border-gray-800/50 pt-4'>
                <div className='grid grid-cols-2 gap-4'>
                  {/* Team Ranking */}
                  <div className='flex flex-col gap-1'>
                    <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>Ranking</p>
                    <p className='text-lg font-bold text-white'>
                      {teamRanking !== null 
                        ? `${teamRanking}${teamRanking === 1 ? 'st' : teamRanking === 2 ? 'nd' : teamRanking === 3 ? 'rd' : 'th'}`
                        : 'N/A'}
                    </p>
                  </div>
                  
                  {/* Total Points */}
                  <div className='flex flex-col gap-1'>
                    <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>Total Points</p>
                    <p className='text-lg font-bold text-white'>{teamPoints.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divider with Football Icon */}
      <div className='relative my-2'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-white/10'></div>
        </div>
        <div className='relative flex justify-center'>
          <div className='px-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-[#3EB489] to-[#8ED6C1] rounded-full flex items-center justify-center shadow-lg border-2 border-white/20'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='white'
                viewBox='0 0 24 24'
                className='w-5 h-5'
              >
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 1c4.97 0 9 4.03 9 9s-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3zm0 1.5c-4.14 0-7.5 3.36-7.5 7.5s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5S16.14 4.5 12 4.5z' />
                <path d='M12 6l-2 2-2-2M12 18l2-2 2 2M6 12l2-2-2-2M18 12l-2-2 2-2' stroke='white' strokeWidth='1.5' fill='none' />
                <circle cx='12' cy='12' r='1.5' fill='white' />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Purchased Players Showcase */}
      <div className='bg-gradient-to-br from-gray-900/95 to-black rounded-3xl p-6 shadow-2xl border border-gray-800/50'>
        <div className='flex items-center justify-between mb-5'>
          <p className='text-xs font-medium text-gray-400 uppercase tracking-wider'>My Squad</p>
              <a
                href='/app/shop'
                className='px-4 py-2 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-white text-xs font-semibold rounded-xl shadow-lg transition-all active:scale-95'
              >
                Buy More
              </a>
        </div>
        {loadingNfts ? (
          <div className='text-center py-12 text-gray-400'>
            <p className='text-base font-medium'>Loading NFTs...</p>
          </div>
        ) : nfts.length > 0 ? (
          <div className='grid grid-cols-2 gap-6'>
            {nfts.map((nft) => {
              const imageUrl = nft.media?.[0]?.url || nft.media?.[0]?.originalUrl || nft.url || '';
              return (
                <div
                  key={nft.identifier}
                  onClick={() => setSelectedNft(nft)}
                  className='w-full aspect-[3/4] rounded-xl overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity'
                >
                  {imageUrl && !imageErrors.has(nft.identifier) ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={nft.name}
                        className='w-full h-full object-cover'
                        onError={() => {
                          setImageErrors((prev) => new Set(prev).add(nft.identifier));
                        }}
                      />
                      {/* Gradient overlay for text readability */}
                      <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/50 to-transparent'></div>
                      {/* Name overlay */}
                      <div className='absolute bottom-0 left-0 right-0 px-4 pb-4'>
                        <p className='text-xs font-semibold text-white text-center drop-shadow-lg'>
                          {nft.name || nft.identifier}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className='w-full h-full bg-gray-800/50 rounded-xl flex flex-col items-center justify-center relative'>
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
                      {/* Gradient overlay for text readability */}
                      <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/50 to-transparent'></div>
                      {/* Name overlay */}
                      <div className='absolute bottom-0 left-0 right-0 px-4 pb-4'>
                        <p className='text-xs font-semibold text-white text-center drop-shadow-lg'>
                          {nft.name || nft.identifier}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className='text-center py-12 text-gray-400'>
            <p className='text-base font-medium'>No players in your squad yet</p>
            <p className='text-sm mt-2 text-gray-500'>Purchase players to build your team!</p>
          </div>
        )}
      </div>

      {/* NFT Modal Popup */}
      {selectedNft && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'
          onClick={() => setSelectedNft(null)}
        >
          <div
            className='relative max-w-2xl w-full max-h-[90vh] bg-gradient-to-br from-gray-900/95 to-black rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedNft(null)}
              className='absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors'
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

            {/* Large Image */}
            <div className='relative w-full aspect-[3/4]'>
              {(() => {
                const imageUrl =
                  selectedNft.media?.[0]?.url ||
                  selectedNft.media?.[0]?.originalUrl ||
                  selectedNft.url ||
                  '';
                return imageUrl && !imageErrors.has(selectedNft.identifier) ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={selectedNft.name}
                      className='w-full h-full object-cover'
                    />
                    {/* Gradient overlay for text readability */}
                    <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/60 to-transparent'></div>
                    {/* Name overlay */}
                    <div className='absolute bottom-0 left-0 right-0 px-6 pb-6'>
                      <p className='text-2xl font-bold text-white text-center drop-shadow-lg'>
                        {selectedNft.name || selectedNft.identifier}
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
                      className='w-24 h-24 text-gray-600'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
                      />
                    </svg>
                    {/* Gradient overlay for text readability */}
                    <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/60 to-transparent'></div>
                    {/* Name overlay */}
                    <div className='absolute bottom-0 left-0 right-0 px-6 pb-6'>
                      <p className='text-2xl font-bold text-white text-center drop-shadow-lg'>
                        {selectedNft.name || selectedNft.identifier}
                      </p>
                    </div>
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
