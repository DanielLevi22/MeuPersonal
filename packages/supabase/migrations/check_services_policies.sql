-- Diagnostic: Check RLS Policies on professional_services
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'professional_services' 
AND schemaname = 'public';
