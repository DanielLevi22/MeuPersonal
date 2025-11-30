-- Diagnostic: Check Constraints on professional_services
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.professional_services'::regclass;
