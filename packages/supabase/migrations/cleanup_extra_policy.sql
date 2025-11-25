-- Remover política extra que pode estar causando conflito
DROP POLICY IF EXISTS "allow_all_own_data" ON profiles;

-- Verificar políticas restantes
SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
