-- Diagnostic: Check Enum and Profiles Triggers
-- 1. Check account_type enum values
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'account_type';

-- 2. Check triggers on public.profiles
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass;
