import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/teams/players?wallet_address=...
 * Get team players for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get('wallet_address');

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('user_teams')
      .select('position, player_nft_identifier')
      .eq('wallet_address', wallet_address)
      .order('position');

    if (error) {
      console.error('Error fetching team players:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team players' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/teams/players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

