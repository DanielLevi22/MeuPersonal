-- ============================================================================
-- LIMPEZA FINAL: Reabilitar RLS e Remover Políticas Temporárias
-- ============================================================================

-- PASSO 1: Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover políticas temporárias (se existirem)
DROP POLICY IF EXISTS "temp_allow_read_for_testing" ON profiles;
DROP POLICY IF EXISTS "temp_allow_all_authenticated" ON profiles;

-- PASSO 3: Verificar políticas finais
SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- PASSO 4: Verificar RLS está habilitado
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Deve ter 6 políticas:
-- 1. Admins can delete users (not super admins) - DELETE
-- 2. Admins can update any profile - UPDATE
-- 3. Admins can view all profiles - SELECT
-- 4. Users can insert own profile - INSERT
-- 5. Users can update own profile - UPDATE
-- 6. Users can view own profile - SELECT
--
-- E rls_enabled = true
