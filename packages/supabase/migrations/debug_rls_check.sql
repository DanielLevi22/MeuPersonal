-- Diagnostic: Debug RLS Check
-- Description: Creates a function to check why RLS is failing for a specific workout.

CREATE OR REPLACE FUNCTION public.debug_rls_check(target_workout_id uuid)
RETURNS TABLE (
  current_user_id uuid,
  jwt_claims jsonb,
  workout_exists boolean,
  workout_owner_id uuid,
  is_admin boolean,
  is_owner boolean,
  can_insert_professional boolean,
  can_insert_admin boolean
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_workout_owner_id uuid;
  v_claims jsonb;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  v_claims := auth.jwt();
  jwt_claims := v_claims;

  -- Check Admin status from claims
  is_admin := (v_claims -> 'app_metadata' ->> 'account_type') = 'admin';

  -- Get workout info
  SELECT personal_id INTO v_workout_owner_id
  FROM workouts
  WHERE id = target_workout_id;

  workout_owner_id := v_workout_owner_id;
  workout_exists := (v_workout_owner_id IS NOT NULL);
  is_owner := (v_workout_owner_id = current_user_id);

  -- Simulate Policy Checks
  can_insert_professional := is_owner;
  can_insert_admin := is_admin;

  RETURN NEXT;
END;
$$;
