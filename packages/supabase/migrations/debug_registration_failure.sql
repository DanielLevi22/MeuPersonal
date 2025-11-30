-- Diagnostic: Debug Registration Failure
-- 1. Check if the user 'carlos' exists in auth.users (did the transaction commit?)
SELECT id, email, created_at 
FROM auth.users 
WHERE raw_user_meta_data->>'full_name' ILIKE '%carlos%';

-- 2. Check account_type enum values (Explicitly)
SELECT e.enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'account_type';

-- 3. Simulate Profile Insertion (Test for Error)
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  -- Try to insert a dummy profile with 'professional' type
  -- This mimics what the trigger does
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    account_type, 
    account_status, 
    subscription_tier, 
    phone, 
    invite_code
  )
  VALUES (
    v_user_id,
    'debug_test@email.com',
    'Debug User',
    'professional', -- Trying to insert text into enum
    'pending',
    NULL,
    '123456789',
    'DEBUG123'
  );
  
  RAISE NOTICE '✓ Manual insertion successful (Simulated)';
  
  -- Rollback so we don't actually leave garbage
  RAISE EXCEPTION 'Test Complete - Rolling Back';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Insertion Failed: % %', SQLERRM, SQLSTATE;
END $$;
