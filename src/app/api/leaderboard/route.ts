import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/leaderboard
 * Get leaderboard sorted by total points
 * Query params: limit (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // First, get all wallet addresses that have players in user_teams
    const { data: teamsWithPlayers, error: teamsError } = await supabaseAdmin
      .from('user_teams')
      .select('wallet_address')
      .limit(10000); // Get all teams with players

    if (teamsError) {
      console.error('Error fetching teams with players:', teamsError);
      return NextResponse.json(
        { error: 'Failed to fetch teams with players' },
        { status: 500 }
      );
    }

    // Get unique wallet addresses
    const walletAddressesWithPlayers = Array.from(new Set(
      (teamsWithPlayers || []).map(t => t.wallet_address)
    ));

    if (walletAddressesWithPlayers.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Now fetch users who have players, sorted by points
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('wallet_address, team_name, total_points, submitted_at')
      .in('wallet_address', walletAddressesWithPlayers)
      .order('total_points', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Add rank to each entry and ensure points is a number
    const leaderboard = (data || []).map((entry, index) => ({
      wallet_address: entry.wallet_address,
      teamName: entry.team_name || null,
      points: entry.total_points || 0,
      rank: index + 1,
      submitted_at: entry.submitted_at
    }));

    return NextResponse.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

