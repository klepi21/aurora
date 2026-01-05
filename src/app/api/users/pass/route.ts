import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/users/pass
 * Update user record after successful Season 2 Pass purchase
 * Requires: wallet_address, tx_hash
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet_address, tx_hash } = body;

        if (!wallet_address || !tx_hash) {
            return NextResponse.json(
                { error: 'Wallet address and transaction hash are required' },
                { status: 400 }
            );
        }

        // Update user record to mark pass as purchased
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({
                has_season_2_pass: true,
                updated_at: new Date().toISOString()
            })
            .eq('wallet_address', wallet_address)
            .select()
            .single();

        if (error) {
            console.error('Error updating pass status:', error);
            return NextResponse.json(
                { error: 'Failed to update pass status' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error in POST /api/users/pass:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
