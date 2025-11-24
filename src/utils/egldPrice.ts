/**
 * Utility functions for EGLD price fetching and USD to EGLD conversion
 */

const EGLD_DECIMALS = 18;
const CACHE_DURATION = 60000; // Cache price for 1 minute

let cachedPrice: { price: number; timestamp: number } | null = null;

/**
 * Fetch EGLD price in USD from CoinGecko API
 */
export async function fetchEGLDPrice(): Promise<number> {
  // Check cache first
  if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_DURATION) {
    return cachedPrice.price;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=elrond-erd-2&vs_currencies=usd'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch EGLD price');
    }

    const data = await response.json();
    const price = data['elrond-erd-2']?.usd;

    if (!price || typeof price !== 'number') {
      throw new Error('Invalid price data');
    }

    // Cache the price
    cachedPrice = { price, timestamp: Date.now() };
    return price;
  } catch (error) {
    console.error('Error fetching EGLD price:', error);
    
    // Return cached price if available, even if expired
    if (cachedPrice) {
      return cachedPrice.price;
    }
    
    // Fallback to a default price if fetch fails (around $50 as fallback)
    return 50;
  }
}

/**
 * Convert USD amount to EGLD amount (in wei/denomination format)
 * Rounds UP to 2 decimal places
 * @param usdAmount - Amount in USD
 * @param egldPrice - EGLD price in USD (optional, will fetch if not provided)
 * @returns EGLD amount as string in wei format (18 decimals)
 */
export async function usdToEgld(usdAmount: number, egldPrice?: number): Promise<string> {
  const price = egldPrice || (await fetchEGLDPrice());
  
  // Calculate EGLD amount
  const egldAmount = usdAmount / price;
  
  // Round UP to 2 decimal places
  const roundedAmount = Math.ceil(egldAmount * 100) / 100;
  
  // Convert to wei (multiply by 10^18)
  const weiAmount = BigInt(Math.ceil(roundedAmount * Math.pow(10, EGLD_DECIMALS)));
  
  return weiAmount.toString();
}

/**
 * Get dynamic costs in EGLD (wei format)
 */
export async function getDynamicCosts() {
  const egldPrice = await fetchEGLDPrice();
  
  return {
    createTeamName: await usdToEgld(1, egldPrice), // $1 USD
    editTeamName: await usdToEgld(3, egldPrice), // $3 USD
    transferPerPlayer: await usdToEgld(0.5, egldPrice), // $0.5 USD per player
    egldPrice
  };
}

