/**
 * Script to create the first admin user
 * Run this with: npx tsx create-admin.ts
 * 
 * Make sure to install tsx first: pnpm add -D tsx
 */

import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

// Admin credentials
const ADMIN_EMAIL = 'daniel@email.com';
const ADMIN_PASSWORD = 'Admin@2024!'; // Change this to a secure password

async function createAdminUser() {
  console.log('🚀 Creating admin user...\n');

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Step 1: Create user in Supabase Auth
    console.log('📝 Step 1: Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Admin',
        account_type: 'admin'
      }
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('✅ User created in Auth:', authData.user.id);

    // Step 2: Create/Update profile
    console.log('\n📝 Step 2: Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: ADMIN_EMAIL,
        full_name: 'Admin',
        account_type: 'admin',
        is_super_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.warn('⚠️  Profile error (may already exist):', profileError.message);
    } else {
      console.log('✅ Profile created/updated');
    }

    // Step 3: Verify admin was created
    console.log('\n📝 Step 3: Verifying admin user...');
    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, account_type, is_super_admin')
      .eq('id', authData.user.id)
      .single();

    if (verifyError) {
      throw new Error(`Verification error: ${verifyError.message}`);
    }

    console.log('✅ Admin user verified:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Account Type:', profile.account_type);
    console.log('   Super Admin:', profile.is_super_admin);

    console.log('\n🎉 SUCCESS! Admin user created successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error: any) {
    console.error('\n❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
