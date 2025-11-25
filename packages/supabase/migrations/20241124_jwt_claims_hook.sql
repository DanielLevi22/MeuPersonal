-- Solution: Store account_type in JWT claims
-- This allows us to check account_type without querying the database
-- Avoiding RLS recursion

-- Create a function to set custom claims in JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_account_type text;
  user_is_super_admin boolean;
BEGIN
  -- Fetch the user's account_type and is_super_admin from profiles
  SELECT account_type, is_super_admin INTO user_account_type, user_is_super_admin
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- Set custom claims
  IF user_account_type IS NOT NULL THEN
    claims := jsonb_set(claims, '{account_type}', to_jsonb(user_account_type));
  END IF;

  IF user_is_super_admin IS NOT NULL THEN
    claims := jsonb_set(claims, '{is_super_admin}', to_jsonb(user_is_super_admin));
  END IF;

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO anon;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;

-- Note: You need to configure this hook in Supabase Dashboard:
-- Authentication > Hooks > Custom Access Token Hook
-- Set the hook to: public.custom_access_token_hook
