import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';
import type { UserRole } from './types';

// Define actions
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Define subjects (resources)
export type Subject =
  | 'Student'
  | 'Workout'
  | 'Diet'
  | 'Exercise'
  | 'Profile'
  | 'Analytics'
  | 'all';

// Define the Ability type
export type AppAbility = MongoAbility<[Action, Subject]>;

// Define abilities based on user role
export function defineAbilitiesFor(role: UserRole): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (role) {
    case 'personal':
      // Personal Trainer can manage students, workouts, and view analytics
      can('manage', 'Student');
      can('manage', 'Workout');
      can('manage', 'Exercise');
      can('read', 'Analytics');
      can('read', 'Profile');
      can('update', 'Profile');
      // Cannot manage diets (only nutritionist can)
      cannot('manage', 'Diet');
      can('read', 'Diet'); // But can view
      break;

    case 'nutritionist':
      // Nutritionist can manage students, diets, and view analytics
      can('manage', 'Student');
      can('manage', 'Diet');
      can('read', 'Analytics');
      can('read', 'Profile');
      can('update', 'Profile');
      // Cannot manage workouts (only personal can)
      cannot('manage', 'Workout');
      can('read', 'Workout'); // But can view
      break;

    case 'student':
      // Student can only read their own data
      can('read', 'Workout');
      can('read', 'Diet');
      can('read', 'Exercise');
      can('read', 'Profile');
      can('update', 'Profile'); // Can update their own profile
      // Cannot create or delete anything
      cannot('create', 'all');
      cannot('delete', 'all');
      cannot('read', 'Analytics');
      break;

    default:
      // No permissions by default
      break;
  }

  return build();
}

// Helper to check if user can perform action
export function canUser(role: UserRole, action: Action, subject: Subject): boolean {
  const ability = defineAbilitiesFor(role);
  return ability.can(action, subject);
}
