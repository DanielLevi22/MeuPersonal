-- Diagnostic: Check Professional Services for 'carlos'
SELECT ps.* 
FROM professional_services ps
JOIN profiles p ON ps.user_id = p.id
WHERE p.email = 'carlos@email.com';
