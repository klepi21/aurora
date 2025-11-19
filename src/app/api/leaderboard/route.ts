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

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('wallet_address, team_name, total_points, submitted_at')
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

