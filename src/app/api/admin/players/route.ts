import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/players
 * Get all players
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('players')
      .select('*')
      .order('points', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching players:', error);
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/players
 * Add a new player
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nft_identifier, name, collection } = body;

    if (!nft_identifier || !name) {
      return NextResponse.json(
        { error: 'NFT identifier and name are required' },
        { status: 400 }
      );
    }

    // Default collection if not provided
    const playerCollection = collection || 'FOOT-9e4e8c';

    const { data, error } = await supabaseAdmin
      .from('players')
      .insert({
        nft_identifier,
        name,
        collection: playerCollection,
        points: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding player:', error);
      // Check if it's a duplicate key error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Player with this identifier already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to add player' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in POST /api/admin/players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate and update total points for a user based on their team players
 */
async function calculateAndUpdateUserPoints(wallet_address: string) {
  try {
    // Get user's team players
    const { data: userTeam, error: teamError } = await supabaseAdmin
      .from('user_teams')
      .select('player_nft_identifier')
      .eq('wallet_address', wallet_address);

    if (teamError || !userTeam || userTeam.length === 0) {
      return;
    }

    const playerIdentifiers = userTeam.map((t) => t.player_nft_identifier);

    // Get points for each player
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('points')
      .in('nft_identifier', playerIdentifiers);

    if (playersError || !players) {
      return;
    }

    // Calculate total
    const totalPoints = players.reduce((sum, player) => sum + (player.points || 0), 0);

    // Update user's total_points
    await supabaseAdmin
      .from('users')
      .update({ total_points: totalPoints })
      .eq('wallet_address', wallet_address);
  } catch (error) {
    console.error(`Error calculating points for user ${wallet_address}:`, error);
  }
}

/**
 * PUT /api/admin/players
 * Update player points (add or subtract)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { nft_identifier, points_change } = body;

    if (!nft_identifier || points_change === undefined) {
      return NextResponse.json(
        { error: 'NFT identifier and points change are required' },
        { status: 400 }
      );
    }

    // First get current points
    const { data: currentPlayer, error: fetchError } = await supabaseAdmin
      .from('players')
      .select('points')
      .eq('nft_identifier', nft_identifier)
      .single();

    if (fetchError || !currentPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    const newPoints = Math.max(0, (currentPlayer.points || 0) + points_change);

    // Update player points
    const { data, error } = await supabaseAdmin
      .from('players')
      .update({ points: newPoints })
      .eq('nft_identifier', nft_identifier)
      .select()
      .single();

    if (error) {
      console.error('Error updating player points:', error);
      return NextResponse.json(
        { error: 'Failed to update player points' },
        { status: 500 }
      );
    }

    // Find all users who have this player in their team
    const { data: userTeams, error: userTeamsError } = await supabaseAdmin
      .from('user_teams')
      .select('wallet_address')
      .eq('player_nft_identifier', nft_identifier);

    if (userTeamsError) {
      console.error('Error fetching user teams:', userTeamsError);
      // Continue even if this fails - player points are already updated
    } else if (userTeams && userTeams.length > 0) {
      // Get unique wallet addresses
      const uniqueWallets = Array.from(new Set(userTeams.map((ut) => ut.wallet_address)));

      // Recalculate points for all affected users
      const updatePromises = uniqueWallets.map((wallet) => calculateAndUpdateUserPoints(wallet));
      await Promise.all(updatePromises);

      console.log(`Updated points for ${uniqueWallets.length} user(s) who have player ${nft_identifier}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in PUT /api/admin/players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/players
 * Delete a player
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nft_identifier = searchParams.get('nft_identifier');

    if (!nft_identifier) {
      return NextResponse.json(
        { error: 'NFT identifier is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('players')
      .delete()
      .eq('nft_identifier', nft_identifier);

    if (error) {
      console.error('Error deleting player:', error);
      return NextResponse.json(
        { error: 'Failed to delete player' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

