/**
 * Test script to verify Supabase connection
 * Run with: npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('wallet_address')
      .limit(1);

    if (tablesError) {
      if (tablesError.code === '42P01') {
        console.log('   ⚠️  Tables not created yet. Please run the SQL schema first.');
      } else {
        console.error('   ❌ Error:', tablesError.message);
      }
    } else {
      console.log('   ✅ Users table exists');
    }

    // Test 2: Check user_teams table
    const { error: teamsError } = await supabase
      .from('user_teams')
      .select('id')
      .limit(1);

    if (teamsError && teamsError.code !== '42P01') {
      console.log('   ✅ User_teams table exists');
    }

    // Test 3: Check players table
    const { error: playersError } = await supabase
      .from('players')
      .select('nft_identifier')
      .limit(1);

    if (playersError && playersError.code !== '42P01') {
      console.log('   ✅ Players table exists');
    }

    console.log('\n✅ Connection successful!');
    console.log('📝 Next: Update frontend to use API routes');
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();

