import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/teams
 * Save or update team name for a user
 * Requires: wallet_address, team_name
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, team_name } = body;

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!team_name || team_name.trim() === '') {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Upsert user record
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          wallet_address,
          team_name: team_name.trim(),
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'wallet_address'
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving team name:', error);
      return NextResponse.json(
        { error: 'Failed to save team name' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in POST /api/teams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/teams?wallet_address=...
 * Get team information for a user including ranking
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

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json({ success: true, data: null });
      }
      console.error('Error fetching team:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch team' },
        { status: 500 }
      );
    }

    // Calculate ranking if user has points
    let rank: number | null = null;
    if (userData.total_points !== null && userData.total_points !== undefined) {
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', userData.total_points);

      // Rank is count of users with more points + 1
      rank = (count || 0) + 1;
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...userData,
        rank
      }
    });
  } catch (error) {
    console.error('Error in GET /api/teams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

