'use client';
import { useState, useEffect, useCallback } from 'react';
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
  const { addToast } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [bets, setBets] = useState<Bet[]>([]);
  const [userBets, setUserBets] = useState<Map<number, UserBet>>(new Map());
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [showCreateBetInfoModal, setShowCreateBetInfoModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBetModal, setShowBetModal] = useState(false);
  const [createBetData, setCreateBetData] = useState({
    title: '',
    question: '',
    closing_timestamp: '',
    outcomes: ['', '']
  });

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
      addToast({
        type: 'error',
        message: 'Failed to load bets'
      });
    } finally {
      setLoading(false);
    }
  }, [network, address, addToast]);

  // Fetch open bets on mount
  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const handlePlaceBet = async () => {
    if (!selectedBet || selectedOutcome === null || !betAmount || !address) {
      addToast({
        type: 'error',
        message: 'Please select an outcome and enter an amount'
      });
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast({
        type: 'error',
        message: 'Please enter a valid amount'
      });
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
      addToast({
        type: 'error',
        message: 'Failed to place bet'
      });
    }
  };

  const handleCreateBet = async () => {
    if (!createBetData.title || !createBetData.question || !createBetData.closing_timestamp || !address) {
      addToast({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    const validOutcomes = createBetData.outcomes.filter(o => o.trim() !== '');
    if (validOutcomes.length < 2) {
      addToast({
        type: 'error',
        message: 'Please provide at least 2 outcomes'
      });
      return;
    }
    if (validOutcomes.length > 5) {
      addToast({
        type: 'error',
        message: 'Maximum 5 outcomes allowed'
      });
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
      addToast({
        type: 'error',
        message: 'Closing time must be in the future'
      });
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
      addToast({
        type: 'error',
        message: 'Failed to create bet'
      });
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
        <Button
          onClick={() => setShowCreateBetInfoModal(true)}
          className='px-4 py-2 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90'
        >
          Create Bet
        </Button>
      </div>

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
        <p className='text-white/60 text-xs mb-2'>
          Closes: {formatDate(bet.closing_timestamp)}
        </p>
        <p className='text-white/60 text-xs'>
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
        className='w-full py-2 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] text-white rounded-lg hover:opacity-90'
      >
        {userBet ? 'Bet More' : 'Place Bet'}
      </Button>
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
                <span className='font-semibold text-[#3EB489]'>From your bet:</span> You will receive 3% of the total betted amount.
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
                <span className='font-semibold text-[#3EB489]'>From your bet:</span> You will receive <span className='font-bold text-white'>3%</span> of the total betted amount.
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

