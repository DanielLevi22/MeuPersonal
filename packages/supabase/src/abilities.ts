import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';
import { supabase } from './client';

// Define actions
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'impersonate' | 'ban';

// Define subjects (resources)
export type Subject =
  | 'User'              // Admin: gerenciar usuários
  | 'AdminPanel'        // Admin: acessar painel admin
  | 'SystemSettings'    // Admin: configurações do sistema
  | 'FeatureFlags'      // Admin: feature flags
  | 'AuditLogs'         // Admin: logs de auditoria
  | 'Client'            // Aluno (gerenciado ou autônomo)
  | 'Workout'
  | 'Diet'
  | 'Exercise'
  | 'Food'
  | 'Profile'
  | 'Analytics'
  | 'Periodization'
  | 'Community'
  | 'all';

// Define the Ability type
export type AppAbility = MongoAbility<[Action, Subject]>;

import {
    AccountType,
    ServiceCategory,
    SubscriptionTier
} from './types';

// User context for ability definition
export interface UserContext {
  accountType: AccountType;
  accountStatus?: 'pending' | 'active' | 'rejected' | 'suspended'; // Account approval status
  isSuperAdmin?: boolean;       // If admin
  services?: ServiceCategory[]; // If professional
  subscriptionTier?: SubscriptionTier; // If autonomous student
  featureAccess?: Record<string, boolean | number>; // Features enabled
}

/**
 * Define abilities based on user context
 */
export function defineAbilitiesFor(context: UserContext): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // === ADMIN (SUPER USER) ===
  if (context.accountType === 'admin') {
    // Full access to everything
    can('manage', 'all');
    
    // Admin-specific abilities
    can('manage', 'User');
    can('manage', 'AdminPanel');
    can('manage', 'SystemSettings');
    can('manage', 'FeatureFlags');
    can('manage', 'AuditLogs');
    can('impersonate', 'User');
    can('delete', 'User');
    can('ban', 'User');
    
    // Note: Super admin deletion protection is enforced at the database level via RLS
    // cannot('delete', 'User', { isSuperAdmin: true }); // Removed - RLS handles this
    
    return build();
  }

  // === PROFISSIONAL ===
  if (context.accountType === 'professional') {
    // Sempre pode gerenciar clientes
    can('manage', 'Client');
    can('read', 'Analytics');
    can('read', 'Profile');
    can('update', 'Profile');

    // Permissões baseadas em serviços oferecidos
    if (context.services?.includes('personal_training')) {
      can('manage', 'Workout');
      can('manage', 'Exercise');
      can('manage', 'Periodization');
      can('read', 'Diet'); // Pode VER dietas de clientes
    }

    if (context.services?.includes('nutrition_consulting')) {
      can('manage', 'Diet');
      can('manage', 'Food');
      can('read', 'Workout'); // Pode VER treinos de clientes
      can('read', 'Periodization');
    }
  }

  // === ALUNO GERENCIADO ===
  if (context.accountType === 'managed_student') {
    can('read', 'Workout');
    can('read', 'Diet');
    can('read', 'Exercise');
    can('read', 'Profile');
    can('update', 'Profile'); // Próprio perfil
    cannot('create', 'all');
    cannot('delete', 'all');
  }

  // === ALUNO AUTÔNOMO (FREEMIUM/PREMIUM) ===
  if (context.accountType === 'autonomous_student') {
    can('read', 'Profile');
    can('update', 'Profile');

    // Permissões baseadas em features habilitadas
    const features = context.featureAccess || {};

    // Treinos
    if (features['workouts_view']) {
      can('read', 'Workout');
      can('read', 'Exercise');
    }
    if (features['workouts_create']) {
      can('create', 'Workout');
      can('update', 'Workout');
      can('delete', 'Workout');
    }

    // Nutrição
    if (features['nutrition_view']) {
      can('read', 'Diet');
      can('read', 'Food');
    }
    if (features['nutrition_create']) {
      can('create', 'Diet');
      can('update', 'Diet');
      can('delete', 'Diet');
    }

    // Periodização
    if (features['periodization_view']) {
      can('read', 'Periodization');
    }
    if (features['periodization_create']) {
      can('create', 'Periodization');
      can('update', 'Periodization');
      can('delete', 'Periodization');
    }

    // Analytics
    if (features['analytics_basic']) {
      can('read', 'Analytics');
    }

    // Community
    if (features['community_access']) {
      can('read', 'Community');
      can('create', 'Community');
    }
  }

  return build();
}

/**
 * Helper to fetch user context from database
 */
export async function getUserContext(userId: string): Promise<UserContext> {
  // 1. Buscar usuário
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('account_type, subscription_tier, is_super_admin')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  const context: UserContext = {
    accountType: user.account_type as AccountType,
  };

  // 2. Se admin, incluir flag de super admin
  if (user.account_type === 'admin') {
    context.isSuperAdmin = user.is_super_admin || false;
    return context; // Admins não precisam de mais contexto
  }

  // 3. Se profissional, buscar serviços
  if (user.account_type === 'professional') {
    const { data: services } = await supabase
      .from('professional_services')
      .select('service_category')
      .eq('user_id', userId)
      .eq('is_active', true);

    context.services = (services?.map(s => s.service_category) || []) as ServiceCategory[];
  }

  // 4. Se aluno autônomo, buscar features
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

  return context;
}

/**
 * Helper to check if user can perform action
 */
export async function canUser(
  userId: string,
  action: Action,
  subject: Subject
): Promise<boolean> {
  const context = await getUserContext(userId);
  const ability = defineAbilitiesFor(context);
  return ability.can(action, subject);
}

/**
 * Check if user has a specific feature (for autonomous students)
 */
export async function userHasFeature(
  userId: string,
  featureKey: string
): Promise<boolean> {
  const context = await getUserContext(userId);
  
  if (context.accountType !== 'autonomous_student') {
    return false;
  }

  return context.featureAccess?.[featureKey] === true;
}

/**
 * Get user's feature limit (for autonomous students)
 */
export async function getUserFeatureLimit(
  userId: string,
  featureKey: string
): Promise<number> {
  const context = await getUserContext(userId);
  
  if (context.accountType !== 'autonomous_student') {
    return 0;
  }

  const limit = context.featureAccess?.[featureKey];
  return typeof limit === 'number' ? limit : 0;
}
