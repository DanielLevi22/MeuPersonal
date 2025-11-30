-- Migration: Update handle_new_user to support service categories
-- Description: Updates the trigger to create professional_services entries based on user metadata
-- Date: 2024-11-26

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Creates profile when new auth user is created. Professional accounts start as pending, others as active.';
