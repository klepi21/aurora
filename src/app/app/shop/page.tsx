'use client';
import { useState, useEffect } from 'react';
import {
  useGetAccountInfo,
  useGetNetworkConfig,
  AbiRegistry,
  Address,
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig,
  ProxyNetworkProvider,
  SmartContractController
} from '@/lib';
import { BigUIntValue, AddressValue } from '@multiversx/sdk-core';
import { Button } from '@/components/Button';
import { signAndSendTransactions } from '@/helpers/signAndSendTransactions';
import nfthubAbi from '@/contracts/nfthub.abi.json';

const NFT_HUB_CONTRACT = 'erd1qqqqqqqqqqqqqpgqs6q7vk3n68pdk89tzxwn7pvfplw600ypfsmsd66w6u';

interface Offer {
  id: string;
  creator: string;
  collection: string;
  token: string;
  price: string;
  availableCount: number;
}

// Offer metadata mapping
const OFFER_METADATA: Record<string, { name: string; image: string }> = {
  '1': { name: 'SALAH', image: 'https://ipfs.io/ipfs/bafybeibhhya4s6w6fxotuqcqpym2qqmzqcpceu5sanuztyyvc2ir6x4fga' },
  '2': { name: 'JULIAN', image: 'https://ipfs.io/ipfs/bafybeidqq6c6wqc5dvpsxehf6keumvrwug7wqqdyj6wb3w56ajqdyu3q4q' },
  '3': { name: 'DONA', image: 'https://ipfs.io/ipfs/bafybeidkvuxvnwmilzpbuwt5aqet4nnehog5sixka7zs5txlogntx64xry' },
  '4': { name: 'RICHARLI', image: 'https://ipfs.io/ipfs/bafybeifgy7w4luk774wasc6qadcmmtsieemsem5umr27aq25ljydmyuhum' }
};

export default function ShopPage() {
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingOfferId, setBuyingOfferId] = useState<string | null>(null);

  // Fetch all offers from contract
  useEffect(() => {
    const fetchOffers = async () => {
      if (!network.apiAddress) return;

      setLoading(true);
      try {
        const proxy = new ProxyNetworkProvider(network.apiAddress);
        const abi = AbiRegistry.create(nfthubAbi);
        const contractAddress = Address.newFromBech32(NFT_HUB_CONTRACT);

        const scController = new SmartContractController({
          chainID: network.chainId,
          networkProvider: proxy,
          abi
        });

        // Use getAllOffers which returns variadic<tuple<Offer,u32>>
        const allOffersResult = await scController.query({
          contract: contractAddress,
          function: 'getAllOffers',
          arguments: []
        });

        const parsedOffers: Offer[] = [];
        
        console.log('=== getAllOffers Result ===');
        console.log('allOffersResult:', allOffersResult);
        console.log('Type:', typeof allOffersResult);
        console.log('Is Array:', Array.isArray(allOffersResult));
        
        // The result structure based on console logs: 
        // Result has key '0' containing array of tuples: [{field0: Offer, field1: count}, ...]
        if (allOffersResult) {
          let tuplesArray: any[] = [];
          
          // Get the value - it might be an object with numeric keys
          const resultValue = allOffersResult.valueOf ? allOffersResult.valueOf() : allOffersResult;
          console.log('resultValue:', resultValue);
          
          if (Array.isArray(resultValue)) {
            tuplesArray = resultValue;
          } else if (typeof resultValue === 'object' && resultValue !== null) {
            // Check if it has numeric keys like '0'
            const keys = Object.keys(resultValue);
            console.log('Object keys:', keys);
            
            // Get the first array value (usually key '0')
            if (keys.length > 0 && Array.isArray((resultValue as any)[keys[0]])) {
              tuplesArray = (resultValue as any)[keys[0]];
            } else {
              // Try to get all values and flatten
              tuplesArray = Object.values(resultValue).flat();
            }
          }
          
          // Flatten the array: [Array(2)] -> [{field0: Offer1, field1: count1}, {field0: Offer2, field1: count2}]
          const flattenedTuples = tuplesArray.flat();
          
          // Process each tuple: {field0: Offer, field1: count}
          for (let i = 0; i < flattenedTuples.length; i++) {
            const tuple = flattenedTuples[i];
            try {
              if (!tuple || typeof tuple !== 'object') {
                continue;
              }
              
              // Access field0 which contains the Offer struct
              const offerStruct = tuple.field0;
              
              if (!offerStruct) {
                continue;
              }
              
              // Extract Offer fields: id, creator, collection, token, price
              const idValue = offerStruct.id;
              const creatorAddress = offerStruct.creator;
              const collectionValue = offerStruct.collection;
              const tokenValue = offerStruct.token;
              const priceValue = offerStruct.price;
              
              // Convert id (BigNumber)
              const id = idValue?.toString(10) || idValue?.valueOf()?.toString(10) || '';
              
              // Handle Address type for creator - convert to bech32 string
              let creator = '';
              if (creatorAddress) {
                try {
                  // The Address object already has publicKey - create Address instance
                  if (creatorAddress.publicKey) {
                    const addr = new Address(creatorAddress.publicKey);
                    creator = addr.toBech32();
                  } else if (creatorAddress instanceof Address) {
                    creator = creatorAddress.toBech32();
                  }
                } catch (addrError) {
                  console.error('Error converting address:', addrError);
                }
              }
              
              // Convert collection (string)
              const collection = collectionValue?.toString() || collectionValue?.valueOf()?.toString() || '';
              
              // Convert token (string)
              const token = tokenValue?.toString() || tokenValue?.valueOf()?.toString() || 'EGLD';
              
              // Convert price (BigNumber)
              const price = priceValue?.toString(10) || priceValue?.valueOf()?.toString(10) || '0';
              
              if (id) {
                parsedOffers.push({
                  id,
                  creator,
                  collection,
                  token,
                  price,
                  availableCount: 0 // Will be updated below
                });
              }
            } catch (error) {
              console.error(`Error parsing tuple ${i}:`, error, tuple);
            }
          }
        }
        
        // Fetch available NFTs count for each offer
        const offersWithAvailability = await Promise.all(
          parsedOffers.map(async (offer) => {
            try {
              const availableNftsResult = await scController.query({
                contract: contractAddress,
                function: 'availableNfts',
                arguments: [new BigUIntValue(BigInt(offer.id))]
              });
              
              let availableCount = 0;
              if (availableNftsResult) {
                const nftsValue = availableNftsResult.valueOf ? availableNftsResult.valueOf() : availableNftsResult;
                console.log(`Available NFTs result for offer ${offer.id}:`, nftsValue);
                console.log(`Type:`, typeof nftsValue, 'Is Array:', Array.isArray(nftsValue));
                
                if (Array.isArray(nftsValue)) {
                  // Direct array of nonces
                  availableCount = nftsValue.length;
                } else if (typeof nftsValue === 'object' && nftsValue !== null) {
                  // For variadic<u64> with multi_result: true, it returns an object with numeric keys
                  // Each key represents one u64 value (nonce)
                  // Count all numeric keys
                  const keys = Object.keys(nftsValue);
                  console.log(`Object keys:`, keys);
                  
                  // Filter to only numeric keys and count them
                  const numericKeys = keys.filter(key => !isNaN(Number(key)));
                  availableCount = numericKeys.length;
                  
                  // Also check if values are arrays (nested structure)
                  if (availableCount === 0 && keys.length > 0) {
                    const firstValue = (nftsValue as any)[keys[0]];
                    if (Array.isArray(firstValue)) {
                      availableCount = firstValue.length;
                    } else if (keys.length === 1 && Array.isArray(Object.values(nftsValue)[0])) {
                      // Single key containing an array
                      availableCount = (Object.values(nftsValue)[0] as any[]).length;
                    }
                  }
                  
                  console.log(`Numeric keys count:`, numericKeys.length, 'All keys:', keys.length);
                }
                
                console.log(`Final availableCount for offer ${offer.id}:`, availableCount);
              }
              
              return {
                ...offer,
                availableCount
              };
            } catch (error) {
              console.error(`Error fetching available NFTs for offer ${offer.id}:`, error);
              return {
                ...offer,
                availableCount: 0
              };
            }
          })
        );
        
        console.log('Final parsed offers with availability:', offersWithAvailability);
        // Filter out offers 1, 2, 3, and 4
        const filteredOffers = offersWithAvailability.filter(
          (offer) => !['1', '2', '3', '4'].includes(offer.id)
        );
        setOffers(filteredOffers);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [network.apiAddress, network.chainId]);

  const handleBuyNft = async (offerId: string) => {
    if (!address) {
      alert('Please connect your wallet');
      return;
    }

    setBuyingOfferId(offerId);
    try {
      const abi = AbiRegistry.create(nfthubAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      // Find the offer to get the price
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Create buyNft transaction
      const buyTransaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(10000000),
          function: 'buyNft',
          contract: new Address(NFT_HUB_CONTRACT),
          nativeTransferAmount: BigInt(offer.price),
          arguments: [new BigUIntValue(BigInt(offerId))]
        }
      );

      await signAndSendTransactions({
        transactions: [buyTransaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing NFT purchase...',
          errorMessage: 'Failed to purchase NFT',
          successMessage: 'NFT purchased successfully!'
        }
      });

      // Refresh offers after purchase
      window.location.reload();
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Failed to purchase NFT. Please try again.');
    } finally {
      setBuyingOfferId(null);
    }
  };

  const formatPrice = (price: string, token: string) => {
    if (!price || price === '0') return 'N/A';
    
    // Convert from wei/denomination to readable format
    const priceNum = BigInt(price);
    const divisor = BigInt('1000000000000000000'); // 1 EGLD = 10^18
    const wholePart = priceNum / divisor;
    const fractionalPart = priceNum % divisor;
    
    if (token === 'EGLD' || !token) {
      const fractionalStr = fractionalPart.toString().padStart(18, '0');
      const decimalPart = fractionalStr.slice(0, 4).replace(/0+$/, '') || '0';
      return `${wholePart.toString()}.${decimalPart}`;
    }
    
    return `${priceNum.toString()} ${token}`;
  };

  return (
    <div className='flex flex-col w-full gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold text-white'>AFL Transfer HUB</h1>
      </div>

      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='text-white/70'>Loading offers...</div>
        </div>
      ) : offers.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-12 gap-4'>
          <p className='text-white/70 text-lg'>Players will be here</p>
          <p className='text-white/50 text-sm'>Check back later for new player listings</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {offers.map((offer) => (
            <div
              key={offer.id}
              className='bg-gradient-to-br from-gray-900/95 to-black rounded-2xl p-6 shadow-2xl border border-gray-800/50 overflow-hidden hover:border-[#3EB489]/50 transition-all'
            >
              <div className='flex flex-col gap-4'>
                {/* NFT Image */}
                <div className='w-full aspect-square bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50'>
                  {OFFER_METADATA[offer.id]?.image ? (
                    <img
                      src={OFFER_METADATA[offer.id].image}
                      alt={OFFER_METADATA[offer.id]?.name || `Offer ${offer.id}`}
                      className='w-full h-full object-cover'
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-white/30 text-4xl flex items-center justify-center w-full h-full">🖼️</div>';
                        }
                      }}
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <div className='text-white/30 text-4xl'>🖼️</div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className='text-xl font-bold text-white mb-3'>
                    {OFFER_METADATA[offer.id]?.name || `Offer #${offer.id}`}
                  </h3>
                  <div className='mb-4 flex items-center gap-2'>
                    <p className='text-white font-semibold text-lg'>
                      {formatPrice(offer.price, offer.token)}
                    </p>
                    {(offer.token === 'EGLD' || !offer.token) && (
                      <img
                        src='https://s2.coinmarketcap.com/static/img/coins/200x200/6892.png'
                        alt='EGLD'
                        className='w-6 h-6'
                      />
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleBuyNft(offer.id)}
                  disabled={buyingOfferId === offer.id || offer.availableCount === 0}
                  className='w-full px-6 py-3 bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-gray-900 font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {buyingOfferId === offer.id 
                    ? 'Processing...' 
                    : offer.availableCount === 0 
                    ? 'Sold Out' 
                    : 'BUY PLAYER'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

