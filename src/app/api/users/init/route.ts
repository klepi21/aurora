import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/users/init
 * Initialize a user record when they first connect their wallet
 * Handles referral code processing
 * Requires: wallet_address, referral_code (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, referral_code } = body;

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('wallet_address, referred_by')
      .eq('wallet_address', wallet_address)
      .single();

    // If user exists and already has a referrer, don't process referral code
    if (existingUser && existingUser.referred_by) {
      return NextResponse.json({
        success: true,
        data: existingUser,
        message: 'User already exists'
      });
    }

    // If referral code provided, validate it and get referrer
    let referredBy: string | null = null;
    if (referral_code) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('wallet_address')
        .eq('referral_code', referral_code)
        .single();

      if (referrer && referrer.wallet_address !== wallet_address) {
        referredBy = referrer.wallet_address;
      }
      // If referral code is invalid or self-referral, silently ignore it
    }

    // Upsert user record
    // If user exists but doesn't have referred_by, update it
    // If user doesn't exist, create new one
    const userData: {
      wallet_address: string;
      referred_by?: string | null;
      updated_at: string;
    } = {
      wallet_address,
      updated_at: new Date().toISOString()
    };

    if (referredBy) {
      userData.referred_by = referredBy;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(userData, {
        onConflict: 'wallet_address'
      })
      .select()
      .single();

    if (error) {
      console.error('Error initializing user:', error);
      return NextResponse.json(
        { error: 'Failed to initialize user' },
        { status: 500 }
      );
    }

    // If this is a new referral, award refpoint to referrer
    // The database trigger should handle this, but we'll also do it manually to be safe
    if (referredBy && (!existingUser || !existingUser.referred_by)) {
      // Get current refpoints of referrer
      const { data: referrerData } = await supabaseAdmin
        .from('users')
        .select('refpoints')
        .eq('wallet_address', referredBy)
        .single();

      if (referrerData) {
        // Increment refpoints
        await supabaseAdmin
          .from('users')
          .update({ refpoints: (referrerData.refpoints || 0) + 1 })
          .eq('wallet_address', referredBy);
      }
    }

    return NextResponse.json({
      success: true,
      data,
      referred: !!referredBy
    });
  } catch (error) {
    console.error('Error in POST /api/users/init:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

