'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useGetAccountInfo,
  useGetAccount,
  useGetNetworkConfig,
  AbiRegistry,
  Address,
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig,
  ProxyNetworkProvider,
  SmartContractController,
  ContractFunction,
  Transaction,
  TransactionComputer
} from '@/lib';
import { BigUIntValue, U64Value, U8Value, BytesValue, AddressValue, ArgSerializer } from '@multiversx/sdk-core';
import { GAS_PRICE, VERSION } from '@/lib';
import { Button } from '@/components/Button';
import { signAndSendTransactions } from '@/helpers/signAndSendTransactions';
import { useToastContext } from '@/components/Toast';
import aurorabetAbi from '@/contracts/aurorabet.abi.json';

const AURORABET_CONTRACT = 'erd1qqqqqqqqqqqqqpgqfjhw9ahyaadrw2k0dwr59yje7xmdc2cwfsms68nepa';
const NFT_COLLECTION = 'AFL-6cefed';
const WHITELISTED_ADDRESS = 'erd1g62v5447qhkn4hjhcrnkuzms9thgqd72xwkdvmwayjq7mqgpfsms5lkmwg';

interface Bet {
  bet_id: number;
  title: string;
  question: string;
  num_outcomes: number;
  creator: string;
  closing_timestamp: number;
  state: number; // 0=Open, 1=Closed, 2=Settled
  general_pool: string;
  total_pool: string;
  winner_outcome: number | null;
}

interface Outcome {
  index: number;
  text: string;
  pool: string;
}

interface UserBet {
  bet_id: number;
  outcome_index: number;
  amount: string;
}

export default function BetPage() {
  const { address } = useGetAccountInfo();
  const { nonce } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { error: showError } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [bets, setBets] = useState<Bet[]>([]);
  const [userBets, setUserBets] = useState<Map<number, UserBet>>(new Map());
  const [hasNft, setHasNft] = useState<boolean>(false);
  const [checkingNft, setCheckingNft] = useState<boolean>(true);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [showBettingInfoModal, setShowBettingInfoModal] = useState(false);
  const [showCreateBetInfoModal, setShowCreateBetInfoModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBetModal, setShowBetModal] = useState(false);
  const [createBetData, setCreateBetData] = useState({
    title: '',
    question: '',
    closing_timestamp: '',
    outcomes: ['', '']
  });
  const [activeTab, setActiveTab] = useState<'bets' | 'admin'>('bets');
  const [closedBets, setClosedBets] = useState<Bet[]>([]);
  const [loadingClosedBets, setLoadingClosedBets] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [betToFinalize, setBetToFinalize] = useState<Bet | null>(null);
  const [selectedWinnerOutcome, setSelectedWinnerOutcome] = useState<number | null>(null);
  const [finalizeOutcomes, setFinalizeOutcomes] = useState<Outcome[]>([]);
  const [loadingFinalizeOutcomes, setLoadingFinalizeOutcomes] = useState(false);

  // Check if user has NFTs from AFL-6cefed collection
  useEffect(() => {
    const checkNftOwnership = async () => {
      if (!address || !network.apiAddress) {
        setHasNft(false);
        setCheckingNft(false);
        return;
      }

      setCheckingNft(true);
      try {
        const response = await fetch(
          `${network.apiAddress}/accounts/${address}/nfts?collections=${NFT_COLLECTION}&size=1`
        );
        if (response.ok) {
          const data = await response.json();
          setHasNft(Array.isArray(data) && data.length > 0);
        } else {
          setHasNft(false);
        }
      } catch (error) {
        setHasNft(false);
      } finally {
        setCheckingNft(false);
      }
    };

    checkNftOwnership();
  }, [address, network.apiAddress]);

  const fetchBets = useCallback(async () => {
    if (!network.apiAddress) return;

    setLoading(true);
    try {
      const proxy = new ProxyNetworkProvider(network.apiAddress);
      const abi = AbiRegistry.create(aurorabetAbi);
      const contractAddress = Address.newFromBech32(AURORABET_CONTRACT);

      const scController = new SmartContractController({
        chainID: network.chainId,
        networkProvider: proxy,
        abi
      });

      // Get open bets - returns variadic<Bet>
      const openBetsResult = await scController.query({
        contract: contractAddress,
        function: 'getOpenBets',
        arguments: []
      });

      const parsedBets: Bet[] = [];
      
      // Handle variadic result - could be array or object with numeric keys
      let betsArray: any[] = [];
      if (openBetsResult) {
        const resultValue = openBetsResult.valueOf ? openBetsResult.valueOf() : openBetsResult;
        
        if (Array.isArray(resultValue)) {
          // Flatten nested arrays (e.g., [[bet1, bet2]] -> [bet1, bet2])
          betsArray = resultValue.flat();
        } else if (typeof resultValue === 'object' && resultValue !== null) {
          // Check if it has numeric keys (variadic results often have '0' key)
          const keys = Object.keys(resultValue);
          
          if (keys.length > 0) {
            // Try to get the array from the first key
            const firstKeyValue = (resultValue as any)[keys[0]];
            
            if (Array.isArray(firstKeyValue)) {
              // Flatten nested arrays
              betsArray = firstKeyValue.flat();
            } else {
              // Try to flatten all values
              betsArray = Object.values(resultValue).flat();
            }
          }
        }
      }

      for (const betData of betsArray) {
        if (!betData || typeof betData !== 'object') {
          continue;
        }
        
          try {
            
            // Parse bytes fields (title, question) - they come as Uint8Array or hex strings
            let title = '';
            let question = '';
            
            if (betData.title) {
              // Handle Uint8Array
              if (betData.title instanceof Uint8Array || (betData.title.constructor && betData.title.constructor.name === 'Uint8Array')) {
                title = Buffer.from(betData.title).toString('utf-8');
              } else if (Array.isArray(betData.title)) {
                // Handle array of numbers
                title = Buffer.from(betData.title).toString('utf-8');
              } else {
                const titleValue = betData.title.toString();
                // Check if it's hex string
                if (titleValue.startsWith('0x') || /^[0-9a-fA-F]+$/.test(titleValue)) {
                  title = Buffer.from(titleValue.replace('0x', ''), 'hex').toString('utf-8');
                } else {
                  title = titleValue;
                }
              }
            }
            
            if (betData.question) {
              // Handle Uint8Array
              if (betData.question instanceof Uint8Array || (betData.question.constructor && betData.question.constructor.name === 'Uint8Array')) {
                question = Buffer.from(betData.question).toString('utf-8');
              } else if (Array.isArray(betData.question)) {
                // Handle array of numbers
                question = Buffer.from(betData.question).toString('utf-8');
              } else {
                const questionValue = betData.question.toString();
                if (questionValue.startsWith('0x') || /^[0-9a-fA-F]+$/.test(questionValue)) {
                  question = Buffer.from(questionValue.replace('0x', ''), 'hex').toString('utf-8');
                } else {
                  question = questionValue;
                }
              }
            }

          // Parse state enum (0=Open, 1=Closed, 2=Settled)
          let state = 0;
          if (betData.state) {
            if (betData.state.discriminant !== undefined) {
              state = Number(betData.state.discriminant);
            } else if (typeof betData.state === 'number') {
              state = betData.state;
            } else {
              state = Number(betData.state.toString() || 0);
            }
          }

          // Parse winner_outcome (Option<u8>)
          let winner_outcome: number | null = null;
          if (betData.winner_outcome !== undefined && betData.winner_outcome !== null) {
            if (betData.winner_outcome.valueOf) {
              const value = betData.winner_outcome.valueOf();
              winner_outcome = value !== undefined && value !== null ? Number(value) : null;
            } else {
              winner_outcome = Number(betData.winner_outcome);
            }
          }

            // Parse bet_id - handle BigNumber or regular number
            let bet_id = 0;
            if (betData.bet_id !== undefined && betData.bet_id !== null) {
              if (typeof betData.bet_id === 'number') {
                bet_id = betData.bet_id;
              } else if (betData.bet_id.toNumber && typeof betData.bet_id.toNumber === 'function') {
                bet_id = betData.bet_id.toNumber();
              } else if (betData.bet_id.toString) {
                bet_id = Number(betData.bet_id.toString());
              } else {
                bet_id = Number(betData.bet_id);
              }
            }

            // Parse num_outcomes - handle u8
            let num_outcomes = 0;
            if (betData.num_outcomes !== undefined && betData.num_outcomes !== null) {
              if (typeof betData.num_outcomes === 'number') {
                num_outcomes = betData.num_outcomes;
              } else {
                num_outcomes = Number(betData.num_outcomes.toString());
              }
            }

            // Parse closing_timestamp - handle u64/BigNumber
            let closing_timestamp = 0;
            if (betData.closing_timestamp !== undefined && betData.closing_timestamp !== null) {
              if (typeof betData.closing_timestamp === 'number') {
                closing_timestamp = betData.closing_timestamp;
              } else if (betData.closing_timestamp.toNumber && typeof betData.closing_timestamp.toNumber === 'function') {
                closing_timestamp = betData.closing_timestamp.toNumber();
              } else if (betData.closing_timestamp.toString) {
                closing_timestamp = Number(betData.closing_timestamp.toString());
              } else {
                closing_timestamp = Number(betData.closing_timestamp);
              }
            }

            // Parse creator address
            let creator = '';
            if (betData.creator) {
              if (betData.creator.bech32) {
                creator = betData.creator.bech32();
              } else if (betData.creator.toString) {
                creator = betData.creator.toString();
              } else {
                creator = String(betData.creator);
              }
            }

            // Parse BigUint pools
            let general_pool = '0';
            let total_pool = '0';
            if (betData.general_pool) {
              general_pool = betData.general_pool.toString();
            }
            if (betData.total_pool) {
              total_pool = betData.total_pool.toString();
            }

            const bet: Bet = {
              bet_id: bet_id,
              title: title,
              question: question,
              num_outcomes: num_outcomes,
              creator: creator,
              closing_timestamp: closing_timestamp,
              state: state,
              general_pool: general_pool,
              total_pool: total_pool,
              winner_outcome: winner_outcome
            };
          
          parsedBets.push(bet);
        } catch (error) {
          // Silently skip invalid bets
        }
      }

      setBets(parsedBets);

      // Fetch user bets if logged in
      if (address) {
        try {
          const userBetsResult = await scController.query({
            contract: contractAddress,
            function: 'getUserBets',
            arguments: [new AddressValue(new Address(address))]
          });

          const userBetsMap = new Map<number, UserBet>();
          
          // Handle variadic result
          let userBetsArray: any[] = [];
          if (userBetsResult) {
            const resultValue = userBetsResult.valueOf ? userBetsResult.valueOf() : userBetsResult;
            
            if (Array.isArray(resultValue)) {
              userBetsArray = resultValue;
            } else if (typeof resultValue === 'object' && resultValue !== null) {
              const keys = Object.keys(resultValue);
              
              if (keys.length > 0) {
                const firstKeyValue = (resultValue as any)[keys[0]];
                
                if (Array.isArray(firstKeyValue)) {
                  userBetsArray = firstKeyValue;
                } else {
                  // Try to flatten all values
                  userBetsArray = Object.values(resultValue).flat();
                }
              }
            }
          }

          for (const userBetDataItem of userBetsArray) {
            // Handle nested arrays - userBetDataItem might be an array containing the object
            let userBetData: any = userBetDataItem;
            
            // If it's an array, get the first element
            if (Array.isArray(userBetDataItem) && userBetDataItem.length > 0) {
              userBetData = userBetDataItem[0];
            }
            
            if (!userBetData || typeof userBetData !== 'object' || Array.isArray(userBetData)) {
              continue;
            }
            
            try {
              // Parse bet_id - handle BigNumber, number, or string
              let bet_id = 0;
              if (userBetData.bet_id !== undefined && userBetData.bet_id !== null) {
                if (typeof userBetData.bet_id === 'number') {
                  bet_id = userBetData.bet_id;
                } else if (userBetData.bet_id.toNumber && typeof userBetData.bet_id.toNumber === 'function') {
                  bet_id = userBetData.bet_id.toNumber();
                } else if (userBetData.bet_id.toString) {
                  const betIdStr = userBetData.bet_id.toString();
                  bet_id = Number(betIdStr);
                } else {
                  bet_id = Number(userBetData.bet_id);
                }
              }
              
              // Skip bet_id 0 - it's likely an invalid/empty value
              // Bet IDs typically start from 1
              if (bet_id === 0) {
                continue;
              }
              
              // Parse outcome_index
              let outcome_index = 0;
              if (userBetData.outcome_index !== undefined && userBetData.outcome_index !== null) {
                if (typeof userBetData.outcome_index === 'number') {
                  outcome_index = userBetData.outcome_index;
                } else if (userBetData.outcome_index.toNumber && typeof userBetData.outcome_index.toNumber === 'function') {
                  outcome_index = userBetData.outcome_index.toNumber();
                } else if (userBetData.outcome_index.toString) {
                  outcome_index = Number(userBetData.outcome_index.toString());
                } else {
                  outcome_index = Number(userBetData.outcome_index);
                }
              }
              
              // Parse amount
              let amount = '0';
              if (userBetData.amount !== undefined && userBetData.amount !== null) {
                if (userBetData.amount.toString) {
                  amount = userBetData.amount.toString();
                } else {
                  amount = String(userBetData.amount);
                }
              }
              
              const userBet: UserBet = {
                bet_id: bet_id,
                outcome_index: outcome_index,
                amount: amount
              };
              
              userBetsMap.set(userBet.bet_id, userBet);
            } catch (error) {
              // Silently skip invalid bets
            }
          }
          
          setUserBets(userBetsMap);
        } catch (error) {
          // Silently handle errors
        }
      }
    } catch (error) {
      showError('Failed to load bets');
    } finally {
      setLoading(false);
    }
  }, [network, address, showError]);

  // Fetch closed bets for admin
  const fetchClosedBets = useCallback(async () => {
    if (!network.apiAddress || !address) return;

    const isWhitelisted = address.toLowerCase() === WHITELISTED_ADDRESS.toLowerCase();
    if (!isWhitelisted) return;

    setLoadingClosedBets(true);
    try {
      const proxy = new ProxyNetworkProvider(network.apiAddress);
      const abi = AbiRegistry.create(aurorabetAbi);
      const contractAddress = Address.newFromBech32(AURORABET_CONTRACT);

      const scController = new SmartContractController({
        chainID: network.chainId,
        networkProvider: proxy,
        abi
      });

      const closedBetsResult = await scController.query({
        contract: contractAddress,
        function: 'getClosedBets',
        arguments: []
      });

      const parsedBets: Bet[] = [];
      let betsArray: any[] = [];
      
      if (closedBetsResult) {
        const resultValue = closedBetsResult.valueOf ? closedBetsResult.valueOf() : closedBetsResult;
        if (Array.isArray(resultValue)) {
          betsArray = resultValue.flat();
        } else if (typeof resultValue === 'object' && resultValue !== null) {
          const keys = Object.keys(resultValue);
          if (keys.length > 0) {
            const firstKeyValue = (resultValue as any)[keys[0]];
            if (Array.isArray(firstKeyValue)) {
              betsArray = firstKeyValue.flat();
            } else {
              betsArray = Object.values(resultValue).flat();
            }
          }
        }
      }

      for (const betData of betsArray) {
        if (!betData || typeof betData !== 'object') continue;
        
        try {
          let title = '';
          let question = '';
          
          if (betData.title) {
            if (betData.title instanceof Uint8Array || (betData.title.constructor && betData.title.constructor.name === 'Uint8Array')) {
              title = Buffer.from(betData.title).toString('utf-8');
            } else if (Array.isArray(betData.title)) {
              title = Buffer.from(betData.title).toString('utf-8');
            } else {
              const titleValue = betData.title.toString();
              if (titleValue.startsWith('0x') || /^[0-9a-fA-F]+$/.test(titleValue)) {
                title = Buffer.from(titleValue.replace('0x', ''), 'hex').toString('utf-8');
              } else {
                title = titleValue;
              }
            }
          }
          
          if (betData.question) {
            if (betData.question instanceof Uint8Array || (betData.question.constructor && betData.question.constructor.name === 'Uint8Array')) {
              question = Buffer.from(betData.question).toString('utf-8');
            } else if (Array.isArray(betData.question)) {
              question = Buffer.from(betData.question).toString('utf-8');
            } else {
              const questionValue = betData.question.toString();
              if (questionValue.startsWith('0x') || /^[0-9a-fA-F]+$/.test(questionValue)) {
                question = Buffer.from(questionValue.replace('0x', ''), 'hex').toString('utf-8');
              } else {
                question = questionValue;
              }
            }
          }

          // Parse state enum (0=Open, 1=Closed, 2=Settled)
          let state = 0;
          if (betData.state !== undefined && betData.state !== null) {
            if (betData.state.discriminant !== undefined) {
              // Enum with discriminant property
              state = Number(betData.state.discriminant);
            } else if (typeof betData.state === 'number') {
              state = betData.state;
            } else if (betData.state.toString) {
              const stateStr = betData.state.toString();
              const parsed = Number(stateStr);
              state = isNaN(parsed) ? 0 : parsed;
            } else {
              state = Number(betData.state) || 0;
            }
          }

          let winner_outcome: number | null = null;
          if (betData.winner_outcome !== undefined && betData.winner_outcome !== null) {
            // Handle Option<u8> type - check if it's None variant
            if (betData.winner_outcome.variant === 'None' || betData.winner_outcome.variant === 'none') {
              winner_outcome = null;
            } else if (betData.winner_outcome.variant === 'Some' || betData.winner_outcome.variant === 'some') {
              const value = betData.winner_outcome.value !== undefined ? betData.winner_outcome.value : betData.winner_outcome;
              winner_outcome = value !== undefined && value !== null ? Number(value) : null;
            } else if (betData.winner_outcome.valueOf) {
              const value = betData.winner_outcome.valueOf();
              // Check if value is actually a valid number, not an object representing None
              if (value !== undefined && value !== null && typeof value !== 'object') {
                winner_outcome = Number(value);
              } else {
                winner_outcome = null;
              }
            } else if (typeof betData.winner_outcome === 'number') {
              winner_outcome = betData.winner_outcome;
            } else {
              // Try to parse as number, but if it fails or is an object, set to null
              const parsed = Number(betData.winner_outcome);
              winner_outcome = isNaN(parsed) ? null : parsed;
            }
          }

          let bet_id = 0;
          if (betData.bet_id !== undefined && betData.bet_id !== null) {
            if (typeof betData.bet_id === 'number') {
              bet_id = betData.bet_id;
            } else if (betData.bet_id.toNumber && typeof betData.bet_id.toNumber === 'function') {
              bet_id = betData.bet_id.toNumber();
            } else if (betData.bet_id.toString) {
              bet_id = Number(betData.bet_id.toString());
            } else {
              bet_id = Number(betData.bet_id);
            }
          }

          let num_outcomes = 0;
          if (betData.num_outcomes !== undefined && betData.num_outcomes !== null) {
            num_outcomes = typeof betData.num_outcomes === 'number' ? betData.num_outcomes : Number(betData.num_outcomes.toString());
          }

          let closing_timestamp = 0;
          if (betData.closing_timestamp !== undefined && betData.closing_timestamp !== null) {
            if (typeof betData.closing_timestamp === 'number') {
              closing_timestamp = betData.closing_timestamp;
            } else if (betData.closing_timestamp.toNumber && typeof betData.closing_timestamp.toNumber === 'function') {
              closing_timestamp = betData.closing_timestamp.toNumber();
            } else if (betData.closing_timestamp.toString) {
              closing_timestamp = Number(betData.closing_timestamp.toString());
            } else {
              closing_timestamp = Number(betData.closing_timestamp);
            }
          }

          let creator = '';
          if (betData.creator) {
            if (betData.creator.bech32) {
              creator = betData.creator.bech32();
            } else if (betData.creator.toString) {
              creator = betData.creator.toString();
            } else {
              creator = String(betData.creator);
            }
          }

          let general_pool = '0';
          if (betData.general_pool !== undefined && betData.general_pool !== null) {
            general_pool = betData.general_pool.toString ? betData.general_pool.toString() : String(betData.general_pool);
          }

          let total_pool = '0';
          if (betData.total_pool !== undefined && betData.total_pool !== null) {
            total_pool = betData.total_pool.toString ? betData.total_pool.toString() : String(betData.total_pool);
          }

          // Only include bets that are actually closed (state === 1) or settled (state === 2) without winner
          // But for "Bets to Finalize", we only want closed bets (state === 1) without winner
          parsedBets.push({
            bet_id,
            title,
            question,
            num_outcomes,
            creator,
            closing_timestamp,
            state,
            general_pool,
            total_pool,
            winner_outcome
          });
        } catch (error) {
          // Silently skip invalid bets
        }
      }

      setClosedBets(parsedBets);
    } catch (error) {
      showError('Failed to load closed bets');
    } finally {
      setLoadingClosedBets(false);
    }
  }, [network, address, showError]);

  // Fetch closed bets when admin tab is active
  useEffect(() => {
    if (activeTab === 'admin' && address) {
      const isWhitelisted = address.toLowerCase() === WHITELISTED_ADDRESS.toLowerCase();
      if (isWhitelisted) {
        fetchBets(); // Refresh open bets to get latest data
        fetchClosedBets();
      }
    }
  }, [activeTab, address, fetchClosedBets, fetchBets]);

  // Fetch open bets on mount
  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const handlePlaceBet = async () => {
    if (!selectedBet || selectedOutcome === null || !betAmount || !address) {
      showError('Please select an outcome and enter an amount');
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    try {
      const abi = AbiRegistry.create(aurorabetAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      const contractAddress = Address.newFromBech32(AURORABET_CONTRACT);
      const amountInWei = BigInt(Math.floor(amount * 1e18));

      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          contract: contractAddress,
          function: 'placeBet',
          gasLimit: BigInt(10000000),
          nativeTransferAmount: amountInWei,
          arguments: [
            new U64Value(selectedBet.bet_id),
            new U8Value(selectedOutcome)
          ]
        }
      );

      await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Placing bet...',
          errorMessage: 'Failed to place bet',
          successMessage: 'Bet placed successfully!'
        }
      });

      setShowBetModal(false);
      setBetAmount('');
      setSelectedOutcome(null);
      setSelectedBet(null);
      
      // Refresh bets
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      showError('Failed to place bet');
    }
  };

  const handleCreateBet = async () => {
    if (!createBetData.title || !createBetData.question || !createBetData.closing_timestamp || !address) {
      showError('Please fill in all required fields');
      return;
    }

    const validOutcomes = createBetData.outcomes.filter(o => o.trim() !== '');
    if (validOutcomes.length < 2) {
      showError('Please provide at least 2 outcomes');
      return;
    }
    if (validOutcomes.length > 5) {
      showError('Maximum 5 outcomes allowed');
      return;
    }

    // Validate closing timestamp is in the future
    // datetime-local input gives us a string like "2024-01-01T14:30" (in user's local time)
    // We need to treat this as UTC time, so we parse it manually
    const closingDateStr = createBetData.closing_timestamp;
    // Parse the datetime-local string and treat it as UTC
    // Format: "YYYY-MM-DDTHH:mm"
    const [datePart, timePart] = closingDateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Create UTC date (month is 0-indexed in JavaScript Date)
    const closingDateUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    const now = new Date();
    if (closingDateUTC <= now) {
      showError('Closing time must be in the future');
      return;
    }

    try {
      // Get bet creation fee
      const proxy = new ProxyNetworkProvider(network.apiAddress);
      const abi = AbiRegistry.create(aurorabetAbi);
      const contractAddress = Address.newFromBech32(AURORABET_CONTRACT);

      const scController = new SmartContractController({
        chainID: network.chainId,
        networkProvider: proxy,
        abi
      });

      // Convert UTC date to Unix timestamp in seconds
      const closingTimestamp = Math.floor(closingDateUTC.getTime() / 1000);

      // Check if address matches the whitelisted address
      const WHITELISTED_ADDRESS = 'erd1g62v5447qhkn4hjhcrnkuzms9thgqd72xwkdvmwayjq7mqgpfsms5lkmwg';
      const isWhitelisted = address.toLowerCase() === WHITELISTED_ADDRESS.toLowerCase();
      
      // If whitelisted, send 0 EGLD (free). Otherwise, send 1 EGLD
      const totalAmount = isWhitelisted ? BigInt(0) : BigInt('1000000000000000000'); // 1 EGLD = 10^18

      // Manually encode transaction data for variadic arguments
      // The SDK's SmartContractTransactionsFactory has issues with variadic multi_arg
      // So we manually encode using ArgSerializer
      const functionName = new ContractFunction('createBet');
      
      // Prepare all arguments - variadic outcomes as separate BytesValue arguments
      const args = [
        BytesValue.fromUTF8(createBetData.title),
        BytesValue.fromUTF8(createBetData.question),
        new U64Value(closingTimestamp)
      ];
      
      // Add each outcome as a separate BytesValue argument (variadic)
      validOutcomes.forEach(outcome => {
        args.push(BytesValue.fromUTF8(outcome));
      });
      
      // Serialize arguments using ArgSerializer
      const serializer = new ArgSerializer();
      const serializedArgs = serializer.valuesToBuffers(args);
      
      // Build transaction data string: function@arg1hex@arg2hex@...
      // This matches mxpy's format where arguments are hex-encoded
      const dataParts: string[] = [functionName.toString()];
      serializedArgs.forEach(buf => {
        dataParts.push(buf.toString('hex'));
      });
      const dataString = dataParts.join('@');
      
      // Create transaction without nonce - let provider handle it (like mxpy --recall-nonce)
      // The provider will fetch the correct nonce automatically during signing
      const transaction = new Transaction({
        chainID: network.chainId,
        gasLimit: BigInt(25000000), // Match mxpy gas limit
        gasPrice: BigInt(GAS_PRICE),
        receiver: contractAddress,
        sender: new Address(address),
        value: totalAmount,
        version: VERSION,
        data: Uint8Array.from(Buffer.from(dataString, 'utf-8')) // Transaction expects Uint8Array
      });

      // Use the standard helper which handles nonce automatically
      await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Creating bet...',
          errorMessage: 'Failed to create bet',
          successMessage: 'Bet created successfully!'
        }
      });

      setShowCreateModal(false);
      setCreateBetData({
        title: '',
        question: '',
        closing_timestamp: '',
        outcomes: ['', '']
      });

      // Refresh bets
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      showError('Failed to create bet');
    }
  };


  const fetchOutcomeText = async (betId: number, outcomeIndex: number): Promise<string> => {
    try {
      const proxy = new ProxyNetworkProvider(network.apiAddress);
      const abi = AbiRegistry.create(aurorabetAbi);
      const contractAddress = Address.newFromBech32(AURORABET_CONTRACT);

      const scController = new SmartContractController({
        chainID: network.chainId,
        networkProvider: proxy,
        abi
      });

      const result = await scController.query({
        contract: contractAddress,
        function: 'getOutcomeText',
        arguments: [
          new U64Value(betId),
          new U8Value(outcomeIndex)
        ]
      });

      if (result) {
        const resultStr = result.toString();
        // Handle hex string (with or without 0x prefix)
        if (resultStr.startsWith('0x') || /^[0-9a-fA-F]+$/.test(resultStr)) {
          return Buffer.from(resultStr.replace('0x', ''), 'hex').toString('utf-8');
        }
        return resultStr;
      }
      return `Outcome ${outcomeIndex + 1}`;
    } catch (error) {
      return `Outcome ${outcomeIndex + 1}`;
    }
  };

  const fetchOutcomePool = async (betId: number, outcomeIndex: number): Promise<string> => {
    try {
      const proxy = new ProxyNetworkProvider(network.apiAddress);
      const abi = AbiRegistry.create(aurorabetAbi);
      const contractAddress = Address.newFromBech32(AURORABET_CONTRACT);

      const scController = new SmartContractController({
        chainID: network.chainId,
        networkProvider: proxy,
        abi
      });

      const result = await scController.query({
        contract: contractAddress,
        function: 'poolsPerOutcome',
        arguments: [
          new U64Value(betId),
          new U64Value(outcomeIndex)
        ]
      });

      return result?.toString() || '0';
    } catch (error) {
      return '0';
    }
  };

  const formatEGLD = (amount: string) => {
    const num = BigInt(amount);
    return (Number(num) / 1e18).toFixed(2);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const isWhitelisted = address ? address.toLowerCase() === WHITELISTED_ADDRESS.toLowerCase() : false;

  // Get bets that need to be closed (all bets from main page that have reached closing time)
  const betsToClose = useMemo(() => {
    if (!bets || bets.length === 0) return [];
    const now = Math.floor(Date.now() / 1000);
    // Show all bets that have reached their closing time (same as showing "Bet Closed" in UI)
    return bets.filter(bet => {
      return bet.closing_timestamp > 0 && bet.closing_timestamp <= now;
    });
  }, [bets]);

  // Get closed bets that need outcome declared (closed but no winner)
  // If a bet is in closedBets array, it means it was fetched from getClosedBets, so it's closed
  const betsToFinalize = useMemo(() => {
    if (!closedBets || closedBets.length === 0) return [];
    return closedBets.filter(bet => {
      // If bet is in closedBets array, it's closed (regardless of parsed state value)
      // Just check that it doesn't have a winner outcome set
      const hasNoWinner = bet.winner_outcome === null || bet.winner_outcome === undefined;
      return hasNoWinner;
    });
  }, [closedBets]);

  const handleCloseBet = async (betId: number) => {
    if (!address) return;

    try {
      const abi = AbiRegistry.create(aurorabetAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      const contractAddress = Address.newFromBech32(AURORABET_CONTRACT);

      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          contract: contractAddress,
          function: 'closeBet',
          gasLimit: BigInt(5000000),
          arguments: [
            new U64Value(betId)
          ]
        }
      );

      await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Closing bet...',
          errorMessage: 'Failed to close bet',
          successMessage: 'Bet closed successfully!'
        }
      });

      // Refresh bets - wait longer for transaction to be processed
      setTimeout(() => {
        fetchBets();
        fetchClosedBets();
      }, 5000);
      
      // Also refresh again after a longer delay to ensure we get the updated state
      setTimeout(() => {
        fetchClosedBets();
      }, 10000);
    } catch (error) {
      showError('Failed to close bet');
    }
  };

  const handleOpenFinalizeModal = async (bet: Bet) => {
    setBetToFinalize(bet);
    setSelectedWinnerOutcome(null);
    setLoadingFinalizeOutcomes(true);
    setShowFinalizeModal(true);

    // Load outcomes for this bet
    const outcomeList: Outcome[] = [];
    for (let i = 0; i < bet.num_outcomes; i++) {
      try {
        const text = await fetchOutcomeText(bet.bet_id, i);
        const pool = await fetchOutcomePool(bet.bet_id, i);
        outcomeList.push({ index: i, text, pool });
      } catch (error) {
        // Skip invalid outcomes
      }
    }
    setFinalizeOutcomes(outcomeList);
    setLoadingFinalizeOutcomes(false);
  };

  const handleFinalizeBet = async () => {
    if (!betToFinalize || selectedWinnerOutcome === null || !address) {
      showError('Please select a winner outcome');
      return;
    }

    try {
      const abi = AbiRegistry.create(aurorabetAbi);
      const contractAddress = Address.newFromBech32(AURORABET_CONTRACT);

      // Manually encode transaction data to ensure both arguments are included
      const functionName = new ContractFunction('finalizeBet');
      const args = [
        new U64Value(betToFinalize.bet_id),
        new U8Value(selectedWinnerOutcome)
      ];

      // Serialize arguments using ArgSerializer (same pattern as createBet)
      const serializer = new ArgSerializer();
      const serializedArgs = serializer.valuesToBuffers(args);
      
      // Build transaction data string: function@arg1hex@arg2hex@...
      const dataParts: string[] = [functionName.toString()];
      serializedArgs.forEach(buf => {
        dataParts.push(buf.toString('hex'));
      });
      const dataString = dataParts.join('@');

      // Create transaction with proper gas limit
      const transaction = new Transaction({
        chainID: network.chainId,
        gasLimit: BigInt(10000000), // Increased gas limit
        gasPrice: BigInt(GAS_PRICE),
        receiver: contractAddress,
        sender: new Address(address),
        value: BigInt(0),
        version: VERSION,
        data: Uint8Array.from(Buffer.from(dataString, 'utf-8'))
      });

      await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Finalizing bet...',
          errorMessage: 'Failed to finalize bet',
          successMessage: 'Bet finalized successfully!'
        }
      });

      setShowFinalizeModal(false);
      setBetToFinalize(null);
      setSelectedWinnerOutcome(null);

      // Refresh bets
      setTimeout(() => {
        fetchBets();
        fetchClosedBets();
      }, 2000);
    } catch (error) {
      showError('Failed to finalize bet');
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-white text-xl'>Loading bets...</div>
      </div>
    );
  }


  return (
    <div className='min-h-screen pb-20'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold text-white'>Betting</h1>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => setShowBettingInfoModal(true)}
            className='p-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors'
            title='How Betting Works'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6 text-white'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </button>
          <div className='flex flex-col items-end gap-2'>
            <Button
              onClick={() => setShowCreateBetInfoModal(true)}
              disabled={!hasNft || checkingNft}
              className='px-4 py-2 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {checkingNft ? 'Checking...' : 'Create Bet'}
            </Button>
            {!checkingNft && !hasNft && (
              <p className='text-red-400 text-xs text-right max-w-[200px]'>
                You need to purchase an NFT from the AFL collection to create bets
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-4 mb-6 border-b border-gray-700/50'>
        <button
          onClick={() => setActiveTab('bets')}
          className={`pb-3 px-4 font-semibold transition-colors ${
            activeTab === 'bets'
              ? 'text-[#3EB489] border-b-2 border-[#3EB489]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Open Bets
        </button>
        {isWhitelisted && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'admin'
                ? 'text-[#3EB489] border-b-2 border-[#3EB489]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Admin
          </button>
        )}
      </div>

      {activeTab === 'bets' && (
        <>
          {bets.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-white/70 text-lg'>No open bets available</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {bets.map((bet) => (
                <BetCard
                  key={bet.bet_id}
                  bet={bet}
                  userBet={userBets.get(bet.bet_id)}
                  onBetClick={() => {
                    setSelectedBet(bet);
                    setShowBetModal(true);
                  }}
                  fetchOutcomeText={fetchOutcomeText}
                  fetchOutcomePool={fetchOutcomePool}
                  formatEGLD={formatEGLD}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'admin' && isWhitelisted && (
        <div className='space-y-6'>
          {/* Bets to Close */}
          <div>
            <h2 className='text-xl font-bold text-white mb-4'>Bets to Close</h2>
            {loading ? (
              <div className='text-white/70 text-sm py-4'>Loading...</div>
            ) : betsToClose.length === 0 ? (
              <div className='text-white/70 text-sm py-4'>No bets need to be closed</div>
            ) : (
              <div className='space-y-3'>
                {betsToClose.map((bet) => (
                  <div key={bet.bet_id} className='bg-gray-800/50 rounded-xl p-4 border border-gray-700/50'>
                    <div className='flex justify-between items-start'>
                      <div className='flex-1'>
                        <h3 className='text-lg font-bold text-white mb-1'>{bet.title}</h3>
                        <p className='text-white/70 text-sm mb-2'>{bet.question}</p>
                        <p className='text-white/60 text-xs'>
                          Closing Time: {formatDate(bet.closing_timestamp)} | Pool: {formatEGLD(bet.total_pool)} EGLD
                        </p>
                        <p className='text-red-400 text-xs mt-1'>
                          ⏰ Past closing time - needs to be closed
                        </p>
                      </div>
                      <Button
                        onClick={() => handleCloseBet(bet.bet_id)}
                        className='ml-4 px-4 py-2 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90'
                      >
                        Close Bet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bets to Finalize */}
          <div>
            <h2 className='text-xl font-bold text-white mb-4'>Bets to Finalize</h2>
            {loadingClosedBets ? (
              <div className='text-white/70 text-sm py-4'>Loading...</div>
            ) : betsToFinalize.length === 0 ? (
              <div className='text-white/70 text-sm py-4'>
                No bets need to be finalized
                {closedBets.length > 0 && (
                  <div className='text-white/50 text-xs mt-2'>
                    Debug: Found {closedBets.length} closed bet(s). 
                    States: {closedBets.map(b => `ID ${b.bet_id}=${b.state}`).join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <div className='space-y-3'>
                {betsToFinalize.map((bet) => (
                  <div key={bet.bet_id} className='bg-gray-800/50 rounded-xl p-4 border border-gray-700/50'>
                    <div className='flex justify-between items-start'>
                      <div className='flex-1'>
                        <h3 className='text-lg font-bold text-white mb-1'>{bet.title}</h3>
                        <p className='text-white/70 text-sm mb-2'>{bet.question}</p>
                        <p className='text-white/60 text-xs'>
                          Pool: {formatEGLD(bet.total_pool)} EGLD
                        </p>
                      </div>
                      <Button
                        onClick={() => handleOpenFinalizeModal(bet)}
                        className='ml-4 px-4 py-2 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90'
                      >
                        Finalize Bet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Finalize Bet Modal */}
      {showFinalizeModal && betToFinalize && (
        <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-900 rounded-xl p-6 max-w-md w-full'>
            <h2 className='text-2xl font-bold text-white mb-2'>Finalize Bet</h2>
            <p className='text-white/70 text-sm mb-4'>{betToFinalize.title}</p>
            <p className='text-white/60 text-xs mb-6'>{betToFinalize.question}</p>

            <div className='space-y-4'>
              <div>
                <label className='block text-white/70 text-sm mb-2'>Select Winner Outcome</label>
                {loadingFinalizeOutcomes ? (
                  <div className='text-white/70 text-sm py-2'>Loading outcomes...</div>
                ) : (
                  <div className='space-y-2'>
                    {finalizeOutcomes.map((outcome) => (
                      <button
                        key={outcome.index}
                        onClick={() => setSelectedWinnerOutcome(outcome.index)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedWinnerOutcome === outcome.index
                            ? 'bg-[#3EB489]/20 border-2 border-[#3EB489]'
                            : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className='flex justify-between items-center'>
                          <span className='text-white'>{outcome.text}</span>
                          <span className='text-white/70 text-sm'>
                            Pool: {formatEGLD(outcome.pool)} EGLD
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className='flex gap-3 mt-6'>
              <Button
                onClick={() => {
                  setShowFinalizeModal(false);
                  setBetToFinalize(null);
                  setSelectedWinnerOutcome(null);
                }}
                className='flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600'
              >
                Cancel
              </Button>
              <Button
                onClick={handleFinalizeBet}
                disabled={selectedWinnerOutcome === null}
                className='flex-1 py-2 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Finalize
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Betting Info Modal */}
      {showBettingInfoModal && (
        <BettingInfoModal
          onClose={() => setShowBettingInfoModal(false)}
        />
      )}

      {/* Create Bet Info Modal */}
      {showCreateBetInfoModal && (
        <CreateBetInfoModal
          isWhitelisted={address ? address.toLowerCase() === 'erd1g62v5447qhkn4hjhcrnkuzms9thgqd72xwkdvmwayjq7mqgpfsms5lkmwg'.toLowerCase() : false}
          onClose={() => setShowCreateBetInfoModal(false)}
          onContinue={() => {
            setShowCreateBetInfoModal(false);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* Create Bet Modal */}
      {showCreateModal && (
        <CreateBetModal
          data={createBetData}
          onChange={setCreateBetData}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBet}
        />
      )}

      {/* Place Bet Modal */}
      {showBetModal && selectedBet && (
        <PlaceBetModal
          bet={selectedBet}
          betAmount={betAmount}
          selectedOutcome={selectedOutcome}
          onAmountChange={setBetAmount}
          onOutcomeSelect={setSelectedOutcome}
          onClose={() => {
            setShowBetModal(false);
            setSelectedBet(null);
            setBetAmount('');
            setSelectedOutcome(null);
          }}
          onSubmit={handlePlaceBet}
          fetchOutcomeText={fetchOutcomeText}
          fetchOutcomePool={fetchOutcomePool}
          formatEGLD={formatEGLD}
        />
      )}

    </div>
  );
}

function BetCard({
  bet,
  userBet,
  onBetClick,
  fetchOutcomeText,
  fetchOutcomePool,
  formatEGLD,
  formatDate
}: {
  bet: Bet;
  userBet?: UserBet;
  onBetClick: () => void;
  fetchOutcomeText: (betId: number, outcomeIndex: number) => Promise<string>;
  fetchOutcomePool: (betId: number, outcomeIndex: number) => Promise<string>;
  formatEGLD: (amount: string) => string;
  formatDate: (timestamp: number) => string;
}) {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loadingOutcomes, setLoadingOutcomes] = useState(true);

  useEffect(() => {
    const loadOutcomes = async () => {
      setLoadingOutcomes(true);
      const outcomeList: Outcome[] = [];
      for (let i = 0; i < bet.num_outcomes; i++) {
        const text = await fetchOutcomeText(bet.bet_id, i);
        const pool = await fetchOutcomePool(bet.bet_id, i);
        outcomeList.push({ index: i, text, pool });
      }
      setOutcomes(outcomeList);
      setLoadingOutcomes(false);
    };
    loadOutcomes();
  }, [bet.bet_id, bet.num_outcomes]);

  return (
    <div className='bg-gray-800/50 rounded-xl p-4 border border-gray-700/50'>
      <div className='mb-3'>
        <h3 className='text-xl font-bold text-white mb-1'>{bet.title}</h3>
        <p className='text-white/70 text-sm'>{bet.question}</p>
      </div>

      <div className='mb-3'>
        <BetCountdown closingTimestamp={bet.closing_timestamp} />
        <p className='text-white/60 text-xs mt-2'>
          Total Pool: {formatEGLD(bet.total_pool)} EGLD
        </p>
      </div>

      {loadingOutcomes ? (
        <div className='text-white/70 text-sm py-2'>Loading outcomes...</div>
      ) : (
        <div className='space-y-2 mb-4'>
          {outcomes.map((outcome) => (
            <div
              key={outcome.index}
              className={`p-2 rounded-lg ${
                userBet?.outcome_index === outcome.index
                  ? 'bg-[#3EB489]/20 border border-[#3EB489]'
                  : 'bg-gray-700/30'
              }`}
            >
              <div className='flex justify-between items-center'>
                <span className='text-white text-sm'>{outcome.text}</span>
                <span className='text-white/70 text-xs'>
                  {formatEGLD(outcome.pool)} EGLD
                </span>
              </div>
              {userBet && userBet.outcome_index === outcome.index && (
                <p className='text-[#3EB489] text-xs mt-1'>
                  Your bet: {formatEGLD(userBet.amount)} EGLD
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={onBetClick}
        disabled={bet.state === 1 || bet.state === 2 || bet.closing_timestamp <= Math.floor(Date.now() / 1000)}
        className='w-full py-2 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {userBet ? 'Bet More' : 'Place Bet'}
      </Button>
    </div>
  );
}

function BetCountdown({ closingTimestamp }: { closingTimestamp: number }) {
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = closingTimestamp - now;

      if (remaining <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      setTimeRemaining({ hours, minutes, seconds });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second for real-time countdown
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [closingTimestamp]);

  if (timeRemaining === null) {
    return (
      <p className='text-white/60 text-xs mb-2'>
        Bet Closes in: Calculating...
      </p>
    );
  }

  if (timeRemaining.hours === 0 && timeRemaining.minutes === 0 && timeRemaining.seconds === 0) {
    return (
      <p className='text-red-400 text-xs mb-2 font-semibold'>
        ⏰ Bet Closed
      </p>
    );
  }

  return (
    <div className='flex items-center gap-2 mb-2'>
      <span className='text-white/60 text-xs'>Bet Closes in:</span>
      <div className='flex items-center gap-1 bg-[#3EB489]/20 border border-[#3EB489]/50 rounded-lg px-2 py-1'>
        <span className='text-[#3EB489] text-sm font-bold'>
          {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
        </span>
      </div>
    </div>
  );
}

function BettingInfoModal({
  onClose
}: {
  onClose: () => void;
}) {
  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 overflow-y-auto pt-16 md:pt-4'>
      <div className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 md:p-6 max-w-2xl w-full border border-gray-700/50 shadow-2xl my-4 md:my-8 max-h-[90vh] overflow-y-auto'>
        <div className='flex justify-between items-start mb-6'>
          <h2 className='text-2xl font-bold text-white'>How Betting Works</h2>
          <button
            onClick={onClose}
            className='text-white/70 hover:text-white text-2xl transition-colors'
          >
            ×
          </button>
        </div>

        <div className='space-y-6 max-h-[70vh] overflow-y-auto pr-2'>
          {/* Overview */}
          <div className='bg-gray-800/50 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-[#3EB489] mb-3 flex items-center gap-2'>
              <span>🎯</span> Overview
            </h3>
            <p className='text-white/80 text-sm leading-relaxed'>
              AuroraBet is a peer-to-peer betting platform where you can create bets or wager EGLD on outcomes. 
              Everything happens on-chain for complete transparency and fairness.
            </p>
          </div>

          {/* Creating Bets */}
          <div className='bg-gray-800/50 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-[#3EB489] mb-3 flex items-center gap-2'>
              <span>➕</span> Creating Bets
            </h3>
            <div className='space-y-2 text-white/80 text-sm'>
              <p>• <span className='font-semibold text-white'>NFT Required:</span> You must own at least one NFT from the <span className='font-semibold text-[#3EB489]'>AFL collection</span> to create bets</p>
              <p>• <span className='font-semibold text-white'>Regular users:</span> Pay 1 EGLD to create a bet</p>
              <p className='ml-4 text-xs text-white/60'>- 0.5 EGLD goes to the bet pool</p>
              <p className='ml-4 text-xs text-white/60'>- 0.5 EGLD goes to developers</p>
              <p>• You can create up to <span className='font-semibold text-white'>5 outcomes</span> per bet</p>
              <p>• Maximum <span className='font-semibold text-white'>1 open bet</span> per user at a time</p>
            </div>
          </div>

          {/* Earning Potential */}
          <div className='bg-gradient-to-r from-[#3EB489]/20 to-[#8ED6C1]/20 border border-[#3EB489]/50 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-[#3EB489] mb-3 flex items-center gap-2'>
              <span>💰</span> Earn Money by Creating Bets!
            </h3>
            <div className='space-y-2 text-white/80 text-sm'>
              <p>• As a bet creator, you earn <span className='font-bold text-[#3EB489]'>5% of the total betted amount</span> when your bet settles</p>
              <p>• Create engaging bets and <span className='font-semibold text-white'>bring people to bet on your outcomes</span> to maximize your earnings!</p>
              <p>• The more people bet on your bet, the more you earn!</p>
            </div>
          </div>

          {/* Placing Bets */}
          <div className='bg-gray-800/50 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-[#3EB489] mb-3 flex items-center gap-2'>
              <span>💰</span> Placing Bets
            </h3>
            <div className='space-y-2 text-white/80 text-sm'>
              <p>• Bet on any open bet until the closing time</p>
              <p>• You can bet on <span className='font-semibold text-white'>multiple outcomes</span> of the same bet</p>
              <p>• You can place <span className='font-semibold text-white'>multiple bets</span> on the same outcome</p>
              <p>• All bets use <span className='font-semibold text-white'>EGLD</span> only</p>
            </div>
          </div>

          {/* How You Win */}
          <div className='bg-gray-800/50 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-[#3EB489] mb-3 flex items-center gap-2'>
              <span>🏆</span> How You Win
            </h3>
            <div className='space-y-2 text-white/80 text-sm'>
              <p>• After the bet closes, admins select the winning outcome</p>
              <p>• <span className='font-semibold text-white'>92%</span> of the total pool is distributed to winners</p>
              <p>• Your payout = <span className='font-semibold text-[#3EB489]'>(Your Stake / Total Stake on Winning Outcome) × Reward Pool</span></p>
              <p>• The earlier you bet, the better your odds!</p>
            </div>
          </div>

          {/* Fees */}
          <div className='bg-gray-800/50 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-[#3EB489] mb-3 flex items-center gap-2'>
              <span>💸</span> Fees
            </h3>
            <div className='space-y-2 text-white/80 text-sm'>
              <p>• <span className='font-semibold text-white'>8%</span> settlement fee is taken from the total pool</p>
              <p className='ml-4 text-xs text-white/60'>- <span className='font-semibold text-[#3EB489]'>5%</span> goes to the bet creator</p>
              <p>• No fees if a bet is cancelled with no bets placed</p>
            </div>
          </div>

          {/* Important Notes */}
          <div className='bg-[#3EB489]/10 border border-[#3EB489]/30 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-[#3EB489] mb-3 flex items-center gap-2'>
              <span>⚠️</span> Important Notes
            </h3>
            <div className='space-y-2 text-white/80 text-sm'>
              <p>• Maximum <span className='font-semibold text-white'>30 open bets</span> can exist at once</p>
              <p>• Bet creators cannot modify bets after creation</p>
              <p>• All timestamps are in <span className='font-semibold text-white'>UTC</span></p>
              <p>• If no one bets on the winning outcome, the entire pool goes to platform creators</p>
            </div>
          </div>
        </div>

        <div className='mt-6'>
          <Button
            onClick={onClose}
            className='w-full py-2.5 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90 transition-opacity font-semibold'
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateBetInfoModal({
  isWhitelisted,
  onClose,
  onContinue
}: {
  isWhitelisted: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700/50 shadow-2xl'>
        <div className='flex justify-between items-start mb-4'>
          <h2 className='text-2xl font-bold text-white'>Create Bet Information</h2>
          <button
            onClick={onClose}
            className='text-white/70 hover:text-white text-2xl transition-colors'
          >
            ×
          </button>
        </div>

        {isWhitelisted ? (
          <div className='space-y-4'>
            <div className='bg-[#3EB489]/20 border border-[#3EB489]/50 rounded-lg p-4'>
              <p className='text-white text-center font-semibold'>
                🎉 You're whitelisted! Bet creation is free for you.
              </p>
            </div>
            <div className='bg-gray-800/50 rounded-lg p-4 space-y-2'>
              <p className='text-white/80 text-sm'>
                <span className='font-semibold text-[#3EB489]'>From your bet:</span> You will receive 5% of the total betted amount.
              </p>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='bg-gradient-to-r from-[#3EB489]/20 to-[#8ED6C1]/20 border border-[#3EB489]/50 rounded-lg p-4'>
              <p className='text-white text-center font-semibold mb-2'>
                💰 Creation Fee: 1 EGLD
              </p>
              <div className='grid grid-cols-2 gap-3 mt-3'>
                <div className='bg-gray-800/50 rounded-lg p-3 text-center'>
                  <p className='text-[#3EB489] font-bold text-lg'>0.5 EGLD</p>
                  <p className='text-white/70 text-xs mt-1'>Bet Pool</p>
                </div>
                <div className='bg-gray-800/50 rounded-lg p-3 text-center'>
                  <p className='text-[#8ED6C1] font-bold text-lg'>0.5 EGLD</p>
                  <p className='text-white/70 text-xs mt-1'>Developers</p>
                </div>
              </div>
            </div>

            <div className='bg-gray-800/50 rounded-lg p-4'>
              <p className='text-white/80 text-sm'>
                <span className='font-semibold text-[#3EB489]'>From your bet:</span> You will receive <span className='font-bold text-white'>5%</span> of the total betted amount.
              </p>
            </div>
          </div>
        )}

        <div className='flex gap-3 mt-6'>
          <Button
            onClick={onClose}
            className='flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
          >
            Cancel
          </Button>
          <Button
            onClick={onContinue}
            className='flex-1 py-2.5 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90 transition-opacity font-semibold'
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateBetModal({
  data,
  onChange,
  onClose,
  onSubmit
}: {
  data: {
    title: string;
    question: string;
    closing_timestamp: string;
    outcomes: string[];
  };
  onChange: (data: any) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const addOutcome = () => {
    if (data.outcomes.length >= 5) {
      return; // Maximum 5 outcomes
    }
    onChange({
      ...data,
      outcomes: [...data.outcomes, '']
    });
  };

  const removeOutcome = (index: number) => {
    if (data.outcomes.length > 2) {
      onChange({
        ...data,
        outcomes: data.outcomes.filter((_, i) => i !== index)
      });
    }
  };

  const updateOutcome = (index: number, value: string) => {
    const newOutcomes = [...data.outcomes];
    newOutcomes[index] = value;
    onChange({
      ...data,
      outcomes: newOutcomes
    });
  };

  // Validate if all fields are completed
  const isValid = () => {
    const hasTitle = data.title.trim() !== '';
    const hasQuestion = data.question.trim() !== '';
    const hasClosingTime = data.closing_timestamp.trim() !== '';
    const validOutcomes = data.outcomes.filter(o => o.trim() !== '');
    const hasEnoughOutcomes = validOutcomes.length >= 2;
    
    return hasTitle && hasQuestion && hasClosingTime && hasEnoughOutcomes;
  };

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto'>
        <h2 className='text-2xl font-bold text-white mb-4'>Create New Bet</h2>

        <div className='space-y-4'>
          <div>
            <label className='block text-white/70 text-sm mb-2'>Title</label>
            <input
              type='text'
              value={data.title}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              className='w-full px-3 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-[#3EB489] focus:outline-none'
              placeholder='e.g., "Real Madrid vs Barcelona"'
            />
          </div>

          <div>
            <label className='block text-white/70 text-sm mb-2'>Question</label>
            <textarea
              value={data.question}
              onChange={(e) => onChange({ ...data, question: e.target.value })}
              className='w-full px-3 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-[#3EB489] focus:outline-none'
              placeholder='e.g., "Which team will score more goals in the first half?"'
              rows={3}
            />
          </div>

          <div>
            <label className='block text-white/70 text-sm mb-2'>Closing Time (UTC)</label>
            <input
              type='datetime-local'
              value={data.closing_timestamp}
              onChange={(e) => onChange({ ...data, closing_timestamp: e.target.value })}
              className='w-full px-3 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-[#3EB489] focus:outline-none'
              placeholder='Select when betting closes'
              step='60'
            />
            <p className='text-white/50 text-xs mt-1'>
              Select the date and time when betting will close (24-hour format, UTC timezone)
            </p>
          </div>

          <div>
            <label className='block text-white/70 text-sm mb-2'>
              Outcomes {data.outcomes.length > 0 && `(${data.outcomes.filter(o => o.trim() !== '').length}/5)`}
            </label>
            <div className='space-y-2'>
              {data.outcomes.map((outcome, index) => (
                <div key={index} className='flex gap-2'>
                  <input
                    type='text'
                    value={outcome}
                    onChange={(e) => updateOutcome(index, e.target.value)}
                    className='flex-1 px-3 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-[#3EB489] focus:outline-none'
                    placeholder={`e.g., "Team A wins" or "Draw"`}
                  />
                  {data.outcomes.length > 2 && (
                    <button
                      onClick={() => removeOutcome(index)}
                      className='px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {data.outcomes.length < 5 && (
              <button
                onClick={addOutcome}
                className='mt-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm'
              >
                + Add Outcome ({data.outcomes.length}/5)
              </button>
            )}
            {data.outcomes.length >= 5 && (
              <p className='mt-2 text-white/50 text-xs'>Maximum 5 outcomes reached</p>
            )}
          </div>
        </div>

        <div className='flex gap-3 mt-6'>
          <Button
            onClick={onClose}
            className='flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600'
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!isValid()}
            className='flex-1 py-2 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Create Bet
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlaceBetModal({
  bet,
  betAmount,
  selectedOutcome,
  onAmountChange,
  onOutcomeSelect,
  onClose,
  onSubmit,
  fetchOutcomeText,
  fetchOutcomePool,
  formatEGLD
}: {
  bet: Bet;
  betAmount: string;
  selectedOutcome: number | null;
  onAmountChange: (amount: string) => void;
  onOutcomeSelect: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
  fetchOutcomeText: (betId: number, outcomeIndex: number) => Promise<string>;
  fetchOutcomePool: (betId: number, outcomeIndex: number) => Promise<string>;
  formatEGLD: (amount: string) => string;
}) {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loadingOutcomes, setLoadingOutcomes] = useState(true);

  useEffect(() => {
    const loadOutcomes = async () => {
      setLoadingOutcomes(true);
      const outcomeList: Outcome[] = [];
      for (let i = 0; i < bet.num_outcomes; i++) {
        const text = await fetchOutcomeText(bet.bet_id, i);
        const pool = await fetchOutcomePool(bet.bet_id, i);
        outcomeList.push({ index: i, text, pool });
      }
      setOutcomes(outcomeList);
      setLoadingOutcomes(false);
    };
    loadOutcomes();
  }, [bet.bet_id, bet.num_outcomes]);

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-900 rounded-xl p-6 max-w-md w-full'>
        <h2 className='text-2xl font-bold text-white mb-2'>{bet.title}</h2>
        <p className='text-white/70 text-sm mb-4'>{bet.question}</p>

        <div className='space-y-4'>
          <div>
            <label className='block text-white/70 text-sm mb-2'>Select Outcome</label>
            {loadingOutcomes ? (
              <div className='text-white/70 text-sm py-2'>Loading outcomes...</div>
            ) : (
              <div className='space-y-2'>
                {outcomes.map((outcome) => (
                  <button
                    key={outcome.index}
                    onClick={() => onOutcomeSelect(outcome.index)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedOutcome === outcome.index
                        ? 'bg-[#3EB489]/20 border-2 border-[#3EB489]'
                        : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className='flex justify-between items-center'>
                      <span className='text-white'>{outcome.text}</span>
                      <span className='text-white/70 text-sm'>
                        Pool: {formatEGLD(outcome.pool)} EGLD
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className='block text-white/70 text-sm mb-2'>Bet Amount (EGLD)</label>
            <input
              type='number'
              value={betAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              className='w-full px-3 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-[#3EB489] focus:outline-none'
              placeholder='0.0'
              step='0.001'
              min='0'
            />
          </div>
        </div>

        <div className='flex gap-3 mt-6'>
          <Button
            onClick={onClose}
            className='flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600'
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={selectedOutcome === null || !betAmount}
            className='flex-1 py-2 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Place Bet
          </Button>
        </div>
      </div>
    </div>
  );
}

