import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { TeamSubmission } from '@/types/database';

/**
 * POST /api/teams/submit
 * Submit a team with selected players
 * Requires: wallet_address, team_name, players[]
 */
export async function POST(request: NextRequest) {
  try {
    const body: TeamSubmission = await request.json();
    const { wallet_address, team_name, players } = body;

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

    if (!players || players.length !== 5) {
      return NextResponse.json(
        { error: 'Exactly 5 players are required' },
        { status: 400 }
      );
    }

    // Validate positions
    const requiredPositions = ['GK', 'DEF1', 'DEF2', 'ATT1', 'ATT2'];
    const providedPositions = players.map((p) => p.position).sort();
    if (JSON.stringify(providedPositions) !== JSON.stringify(requiredPositions.sort())) {
      return NextResponse.json(
        { error: 'Invalid positions. Required: GK, DEF1, DEF2, ATT1, ATT2' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Start transaction: Update user and replace team
    // 1. Upsert user with team name and submitted_at
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          wallet_address,
          team_name: team_name.trim(),
          submitted_at: now,
          updated_at: now
        },
        {
          onConflict: 'wallet_address'
        }
      );

    if (userError) {
      console.error('Error updating user:', userError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // 2. Get existing team to:
    //    a) Preserve points_at_creation for unchanged players
    //    b) Calculate permanent points from players being removed
    const { data: existingTeam, error: existingTeamError } = await supabaseAdmin
      .from('user_teams')
      .select('player_nft_identifier, points_at_creation')
      .eq('wallet_address', wallet_address);

    if (existingTeamError) {
      console.error('Error fetching existing team:', existingTeamError);
      return NextResponse.json(
        { error: 'Failed to fetch existing team' },
        { status: 500 }
      );
    }

    // Create a map of existing points_at_creation values
    const existingPointsAtCreationMap = new Map(
      (existingTeam || []).map((t) => [t.player_nft_identifier, t.points_at_creation])
    );

    // 3. Calculate permanent points from players being removed
    // Get current user's total_points (which includes permanent points from previous removals)
    const { data: currentUser, error: userFetchError } = await supabaseAdmin
      .from('users')
      .select('total_points')
      .eq('wallet_address', wallet_address)
      .single();

    let permanentPoints = (currentUser?.total_points || 0);

    if (existingTeam && existingTeam.length > 0) {
      // Get current points for all existing players
      const existingPlayerIdentifiers = existingTeam.map((t) => t.player_nft_identifier);
      const { data: existingPlayersData, error: existingPlayersError } = await supabaseAdmin
        .from('players')
        .select('nft_identifier, points')
        .in('nft_identifier', existingPlayerIdentifiers);

      if (!existingPlayersError && existingPlayersData) {
        const existingPlayerPointsMap = new Map(
          existingPlayersData.map((p) => [p.nft_identifier, p.points || 0])
        );

        // Identify players being removed (in old team but not in new team)
        const newPlayerIdentifiers = new Set(players.map((p) => p.nft_identifier));
        const removedPlayers = existingTeam.filter(
          (t) => !newPlayerIdentifiers.has(t.player_nft_identifier)
        );

        // Calculate points earned by removed players and add to permanent total
        for (const removedPlayer of removedPlayers) {
          const currentPoints = existingPlayerPointsMap.get(removedPlayer.player_nft_identifier) || 0;
          const pointsAtCreation = removedPlayer.points_at_creation !== null && removedPlayer.points_at_creation !== undefined
            ? removedPlayer.points_at_creation
            : 0;
          const pointsEarned = Math.max(0, currentPoints - pointsAtCreation);
          permanentPoints += pointsEarned;
        }
      }
    }

    // 4. Delete existing team for this user
    const { error: deleteError } = await supabaseAdmin
      .from('user_teams')
      .delete()
      .eq('wallet_address', wallet_address);

    if (deleteError) {
      console.error('Error deleting old team:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete old team' },
        { status: 500 }
      );
    }

    // 5. Get current points for each player
    const playerIdentifiers = players.map((p) => p.nft_identifier);
    const { data: currentPlayers, error: playersFetchError } = await supabaseAdmin
      .from('players')
      .select('nft_identifier, points')
      .in('nft_identifier', playerIdentifiers);

    if (playersFetchError) {
      console.error('Error fetching player points:', playersFetchError);
      return NextResponse.json(
        { error: 'Failed to fetch player points' },
        { status: 500 }
      );
    }

    // Create a map of current player points
    const playerPointsMap = new Map(
      (currentPlayers || []).map((p) => [p.nft_identifier, p.points || 0])
    );

    // 6. Insert new team players with preserved or new points_at_creation
    // For players that were already in the team: preserve their original points_at_creation
    // For new players: use their current points as points_at_creation
    const teamRecords = players.map((player) => {
      const existingPointsAtCreation = existingPointsAtCreationMap.get(player.nft_identifier);
      // If player was already in the team, preserve their original points_at_creation
      // Otherwise, use current points as the new baseline
      const pointsAtCreation = existingPointsAtCreation !== null && existingPointsAtCreation !== undefined
        ? existingPointsAtCreation
        : (playerPointsMap.get(player.nft_identifier) || 0);

      return {
        wallet_address,
        player_nft_identifier: player.nft_identifier,
        position: player.position,
        points_at_creation: pointsAtCreation,
        created_at: now,
        updated_at: now
      };
    });

    const { error: insertError } = await supabaseAdmin
      .from('user_teams')
      .insert(teamRecords);

    if (insertError) {
      console.error('Error inserting team:', insertError);
      return NextResponse.json(
        { error: 'Failed to save team' },
        { status: 500 }
      );
    }

    // 7. Calculate total points: permanent points + current team contributions
    await calculateAndUpdateUserPoints(wallet_address, permanentPoints);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/teams/submit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate total points for a user based on their team players
 * @param wallet_address - User's wallet address
 * @param permanentPoints - Permanent points from previously removed players (default: 0)
 */
async function calculateAndUpdateUserPoints(wallet_address: string, permanentPoints: number = 0) {
  try {
    // Get user's team players with their points_at_creation
    const { data: userTeam, error: teamError } = await supabaseAdmin
      .from('user_teams')
      .select('player_nft_identifier, points_at_creation')
      .eq('wallet_address', wallet_address);

    if (teamError || !userTeam || userTeam.length === 0) {
      // If no team, just update with permanent points
      await supabaseAdmin
        .from('users')
        .update({ total_points: permanentPoints, updated_at: new Date().toISOString() })
        .eq('wallet_address', wallet_address);
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
    // For each player: current_points - points_at_creation
    const currentTeamPoints = userTeam.reduce((sum, teamPlayer) => {
      const currentPoints = currentPointsMap.get(teamPlayer.player_nft_identifier) || 0;
      // Handle NULL points_at_creation: if NULL, treat as 0 (points_at_creation defaults to 0)
      // But if it's explicitly set, use that value
      const pointsAtCreation = teamPlayer.points_at_creation !== null && teamPlayer.points_at_creation !== undefined 
        ? teamPlayer.points_at_creation 
        : 0;
      // Only count positive differences (points gained after team creation)
      const pointsGained = Math.max(0, currentPoints - pointsAtCreation);
      return sum + pointsGained;
    }, 0);

    // Total points = permanent points (from removed players) + current team contributions
    const totalPoints = permanentPoints + currentTeamPoints;

    // Update user's total points
    await supabaseAdmin
      .from('users')
      .update({ total_points: totalPoints, updated_at: new Date().toISOString() })
      .eq('wallet_address', wallet_address);
  } catch (error) {
    console.error('Error calculating user points:', error);
  }
}

