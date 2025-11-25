/**
 * JWT-based getUserContext - Avoids RLS recursion
 * 
 * This version checks JWT claims FIRST before querying the database.
 * For admin users, this completely avoids the RLS recursion issue.
 */

import type { UserContext } from './abilities';
import { supabase } from './client';
import type { AccountType, ServiceCategory, SubscriptionTier } from './types';

export async function getUserContextJWT(userId: string): Promise<UserContext> {
  // STEP 1: Check JWT claims first (no database query = no RLS issues)
  const { data: { session } } = await supabase.auth.getSession();
  const jwtClaims = session?.user?.app_metadata || {};
  
  console.log('🔍 getUserContextJWT - userId:', userId);
  console.log('🔍 getUserContextJWT - JWT claims:', jwtClaims);
  
  // If account_type is in JWT claims and it's admin, return immediately (fast path)
  if (jwtClaims.account_type === 'admin') {
    console.log('✅ Admin detected from JWT, skipping database query');
    return {
      accountType: 'admin' as AccountType,
      isSuperAdmin: jwtClaims.is_super_admin || false,
    };
  }
  
  // STEP 2: Query database (for all users, including admins if JWT doesn't have claims)
  console.log('🔍 Querying database for user context...');
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('account_type, subscription_tier, is_super_admin')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error('❌ Error fetching user:', userError);
    throw new Error('User not found');
  }

  console.log('✅ User data from database:', user);

  const context: UserContext = {
    accountType: user.account_type as AccountType,
  };

  // If user is admin, add super admin flag
  if (user.account_type === 'admin') {
    context.isSuperAdmin = user.is_super_admin || false;
    console.log('🔐 Admin user detected from database:', {
      accountType: context.accountType,
      isSuperAdmin: context.isSuperAdmin
    });
    return context; // Return early for admins
  }

  // STEP 3: Fetch additional context based on account type
  if (user.account_type === 'professional') {
    const { data: services } = await supabase
      .from('professional_services')
      .select('service_category')
      .eq('user_id', userId)
      .eq('is_active', true);

    context.services = (services?.map(s => s.service_category) || []) as ServiceCategory[];
  }

  if (user.account_type === 'autonomous_student') {
    context.subscriptionTier = user.subscription_tier as SubscriptionTier;

    const { data: features } = await supabase
      .from('feature_access')
      .select('feature_key, is_enabled, limit_value')
      .eq('subscription_tier', user.subscription_tier);

    context.featureAccess = {};
    features?.forEach(f => {
      context.featureAccess![f.feature_key] = f.limit_value ?? f.is_enabled;
    });
  }

  console.log('✅ User context loaded:', context);
  return context;
}
