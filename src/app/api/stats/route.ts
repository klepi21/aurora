import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/stats
 * Get statistics for the landing page
 */
export async function GET() {
  try {
    // Get total number of registered teams (users who have set a team name)
    const { count, error, data } = await supabaseAdmin
      .from('users')
      .select('wallet_address, team_name', { count: 'exact', head: false })
      .not('team_name', 'is', null);

    if (error) {
      console.error('Error fetching stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // Debug logging
    console.log('Total registered teams:', count);
    if (data) {
      console.log('Teams found:', data.map(u => ({ wallet: u.wallet_address, team: u.team_name })));
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

