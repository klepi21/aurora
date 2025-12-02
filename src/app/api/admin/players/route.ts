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
    const playerCollection = collection || 'AFL-6cefed';

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
 * This function preserves permanent points from removed players by reading current total_points
 * @param wallet_address - User's wallet address
 */
async function calculateAndUpdateUserPoints(wallet_address: string) {
  try {
    // Get current user's total_points (which includes permanent points from removed players)
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('total_points')
      .eq('wallet_address', wallet_address)
      .single();

    // Extract permanent points: current total minus current team contributions
    // We'll recalculate current team contributions and add them back
    let permanentPoints = 0;
    
    // Get user's team players with their points_at_creation
    const { data: userTeam, error: teamError } = await supabaseAdmin
      .from('user_teams')
      .select('player_nft_identifier, points_at_creation')
      .eq('wallet_address', wallet_address);

    if (teamError || !userTeam || userTeam.length === 0) {
      // No team, keep current total_points as permanent
      return;
    }

    const playerIdentifiers = userTeam.map((t) => t.player_nft_identifier);

    // Get current points for each player
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('nft_identifier, points')
      .in('nft_identifier', playerIdentifiers);

    if (playersError || !players) {
      return;
    }

    // Create a map of current player points
    const currentPointsMap = new Map(
      players.map((p) => [p.nft_identifier, p.points || 0])
    );

    // Calculate current team contributions: only count points gained AFTER team creation
    const currentTeamPoints = userTeam.reduce((sum, teamPlayer) => {
      const currentPoints = currentPointsMap.get(teamPlayer.player_nft_identifier) || 0;
      const pointsAtCreation = teamPlayer.points_at_creation !== null && teamPlayer.points_at_creation !== undefined 
        ? teamPlayer.points_at_creation 
        : 0;
      const pointsGained = Math.max(0, currentPoints - pointsAtCreation);
      return sum + pointsGained;
    }, 0);

    // Calculate permanent points: current total - current team contributions
    // This preserves points from previously removed players
    const currentTotal = currentUser?.total_points || 0;
    permanentPoints = Math.max(0, currentTotal - currentTeamPoints);

    // Total points = permanent points + updated current team contributions
    const totalPoints = permanentPoints + currentTeamPoints;

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

