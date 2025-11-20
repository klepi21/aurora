import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/stats
 * Get statistics for the landing page
 */
export async function GET() {
  try {
    // First get count of users with team names
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('team_name', 'is', null);

    if (countError) {
      console.error('Error fetching stats count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // Also fetch actual data for debugging
    const { data, error: dataError } = await supabaseAdmin
      .from('users')
      .select('wallet_address, team_name')
      .not('team_name', 'is', null);

    if (dataError) {
      console.error('Error fetching stats data:', dataError);
    } else {
      console.log('Total registered teams:', count);
      console.log('Teams found:', data?.map(u => ({ wallet: u.wallet_address?.substring(0, 8), team: u.team_name })));
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

