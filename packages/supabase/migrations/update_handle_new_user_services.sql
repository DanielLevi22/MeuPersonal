-- Migration: Update handle_new_user to support Professional Services
-- Description: Updates the trigger function to insert services from metadata into professional_services table.
-- Date: 2024-11-26

-- ============================================================================
-- 1. UPDATE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_account_type text;
  v_account_status account_status;
  v_subscription_tier subscription_tier;
  v_services jsonb;
  v_service text;
BEGIN
  -- Get account type from metadata
  v_account_type := COALESCE(new.raw_user_meta_data->>'account_type', 'autonomous_student');
  
  -- Determine account status
  v_account_status := CASE 
    WHEN v_account_type = 'professional' THEN 'pending'::account_status
    ELSE 'active'::account_status
  END;
  
  -- Set subscription tier for autonomous students
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

  -- Handle Professional Services
  IF v_account_type = 'professional' THEN
    v_services := new.raw_user_meta_data->'services';
    
    -- If services provided in metadata, insert them
    IF v_services IS NOT NULL AND jsonb_typeof(v_services) = 'array' THEN
      FOR v_service IN SELECT * FROM jsonb_array_elements_text(v_services)
      LOOP
        -- Map service names if necessary (e.g. from frontend 'personal_trainer' to db 'training')
        -- Assuming frontend sends 'personal_training' and 'nutrition_consulting' matching DB enum/values
        INSERT INTO public.professional_services (user_id, service_category, is_active)
        VALUES (new.id, v_service::service_category, true)
        ON CONFLICT DO NOTHING;
      END LOOP;
    ELSE
      -- Default to both if no services specified (fallback for legacy/direct inserts)
      INSERT INTO public.professional_services (user_id, service_category, is_active)
      VALUES 
        (new.id, 'personal_training', true),
        (new.id, 'nutrition_consulting', true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN new;
END;
$$;

-- ============================================================================
-- 2. BACKFILL EXISTING PROFESSIONALS
-- ============================================================================

-- Insert default services for existing professionals who have none
INSERT INTO public.professional_services (user_id, service_category, is_active)
SELECT p.id, 'personal_training', true
FROM public.profiles p
WHERE p.account_type = 'professional'
AND NOT EXISTS (
  SELECT 1 FROM public.professional_services ps 
  WHERE ps.user_id = p.id AND ps.service_category = 'personal_training'
);

INSERT INTO public.professional_services (user_id, service_category, is_active)
SELECT p.id, 'nutrition_consulting', true
FROM public.profiles p
WHERE p.account_type = 'professional'
AND NOT EXISTS (
  SELECT 1 FROM public.professional_services ps 
  WHERE ps.user_id = p.id AND ps.service_category = 'nutrition_consulting'
);
