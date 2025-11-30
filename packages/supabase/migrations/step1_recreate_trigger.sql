-- STEP 1: Drop and recreate the trigger function
-- Execute this first

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_account_type text;
  v_account_status account_status;
  v_subscription_tier subscription_tier;
BEGIN
  -- Get account type from metadata
  v_account_type := COALESCE(new.raw_user_meta_data->>'account_type', 'autonomous_student');
  
  -- Determine account status
  v_account_status := CASE 
    WHEN v_account_type = 'professional' THEN 'pending'::account_status
    ELSE 'active'::account_status
  END;
  
  -- Set subscription tier for autonomous students (required by constraint)
  v_subscription_tier := CASE
    WHEN v_account_type = 'autonomous_student' THEN 'free'::subscription_tier
    ELSE NULL
  END;

  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, account_type, account_status, subscription_tier)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    v_account_type::account_type,
    v_account_status,
    v_subscription_tier
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
