-- Diagnostic: Check Latest Profile
SELECT * FROM profiles 
ORDER BY created_at DESC 
LIMIT 1;
