import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/referrals?wallet_address=...
 * Get referral information for a user including:
 * - referral_code
 * - referral_link
 * - refpoints
 * - referral_count (number of users referred)
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

    // Get user data including referral info
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('referral_code, refpoints, referred_by')
      .eq('wallet_address', wallet_address)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        // User doesn't exist yet - create one with referral code
        // This will be handled when they first connect
        return NextResponse.json({ 
          success: true, 
          data: {
            referral_code: null,
            referral_link: null,
            refpoints: 0,
            referral_count: 0,
            referred_by: null
          }
        });
      }
      console.error('Error fetching referral data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch referral data' },
        { status: 500 }
      );
    }

    // Ensure user has a referral code (should be auto-generated, but just in case)
    let referralCode = userData.referral_code;
    if (!referralCode) {
      // Generate a unique referral code
      const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let newCode = generateCode();
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('wallet_address')
          .eq('referral_code', newCode)
          .single();

        if (!existing) {
          break;
        }
        newCode = generateCode();
        attempts++;
      }

      // Update user with referral code
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ referral_code: newCode })
        .eq('wallet_address', wallet_address);

      if (updateError) {
        console.error('Error updating referral code:', updateError);
      } else {
        referralCode = newCode;
      }
    }

    // Count number of users referred by this user
    const { count: referralCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', wallet_address);

    // Get referrer info if user was referred
    let referrerInfo: { wallet_address: string; team_name: string | null } | null = null;
    if (userData.referred_by) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('wallet_address, team_name')
        .eq('wallet_address', userData.referred_by)
        .single();

      if (referrer) {
        referrerInfo = {
          wallet_address: referrer.wallet_address,
          team_name: referrer.team_name
        };
      }
    }

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (request.headers.get('origin') || 'http://localhost:3000');
    const referralLink = referralCode 
      ? `${baseUrl}/app?ref=${referralCode}`
      : null;

    return NextResponse.json({
      success: true,
      data: {
        referral_code: referralCode,
        referral_link: referralLink,
        refpoints: userData.refpoints || 0,
        referral_count: referralCount || 0,
        referred_by: referrerInfo
      }
    });
  } catch (error) {
    console.error('Error in GET /api/referrals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

