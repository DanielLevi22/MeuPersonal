-- Diagnostic: Check Triggers on Nutrition Tables
SELECT 
    tgname, 
    tgrelid::regclass as table_name,
    tgenabled,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid IN ('public.meal_items'::regclass, 'public.meals'::regclass);
