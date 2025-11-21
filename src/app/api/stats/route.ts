import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/stats
 * Get statistics for the landing page
 */
export async function GET() {
  try {
    // Get all wallet addresses that have players in user_teams (teams with selected players)
    const { data: teamsWithPlayers, error: teamsError } = await supabaseAdmin
      .from('user_teams')
      .select('wallet_address')
      .limit(10000);

    if (teamsError) {
      console.error('Error fetching teams with players:', teamsError);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // Get unique wallet addresses (teams that have selected players)
    const walletAddressesWithPlayers = Array.from(new Set(
      (teamsWithPlayers || []).map(t => t.wallet_address)
    ));

    const count = walletAddressesWithPlayers.length;

    // Also fetch actual data for debugging
    if (walletAddressesWithPlayers.length > 0) {
      const { data, error: dataError } = await supabaseAdmin
        .from('users')
        .select('wallet_address, team_name')
        .in('wallet_address', walletAddressesWithPlayers);

      if (dataError) {
        console.error('Error fetching stats data:', dataError);
      } else {
        console.log('Total registered teams:', count);
        console.log('Teams found:', data?.map(u => ({ wallet: u.wallet_address?.substring(0, 8), team: u.team_name })));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalPlayers: count || 0
      }
    });
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

