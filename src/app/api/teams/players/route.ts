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

    // Get player points for each player
    const playerIdentifiers = (data || []).map((p) => p.player_nft_identifier);
    let playerPointsMap: Record<string, number> = {};

    if (playerIdentifiers.length > 0) {
      const { data: playersData, error: playersError } = await supabaseAdmin
        .from('players')
        .select('nft_identifier, points')
        .in('nft_identifier', playerIdentifiers);

      if (!playersError && playersData) {
        playerPointsMap = playersData.reduce((acc, player) => {
          acc[player.nft_identifier] = player.points || 0;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // Add points to each player data
    const dataWithPoints = (data || []).map((player) => ({
      ...player,
      points: playerPointsMap[player.player_nft_identifier] || 0
    }));

    return NextResponse.json({ success: true, data: dataWithPoints });
  } catch (error) {
    console.error('Error in GET /api/teams/players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

