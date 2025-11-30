-- ============================================================================
-- DIAGNÓSTICO RLS - Execute este SQL no Supabase Dashboard
-- ============================================================================

-- 1. Ver todas as políticas RLS da tabela profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Ver definição da função is_admin()
SELECT pg_get_functiondef('is_admin()'::regprocedure);

-- 4. Verificar hook JWT
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'custom_access_token_hook';

-- 5. Testar se você consegue acessar seu próprio perfil
SELECT id, email, account_type, is_super_admin
FROM profiles
WHERE id = auth.uid();

-- 6. Ver todos os usuários admin
SELECT id, email, account_type, is_super_admin, created_at
FROM profiles
WHERE account_type = 'admin';

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================

-- Query 1: Deve mostrar políticas incluindo:
--   - "Users can view own profile"
--   - "Admins can view all profiles"
--   - etc.

-- Query 2: rowsecurity deve ser TRUE

-- Query 3: Deve mostrar função usando current_setting('request.jwt.claims'...)

-- Query 4: Deve retornar 1 linha com custom_access_token_hook

-- Query 5: Deve retornar SEU perfil (se você estiver logado)

-- Query 6: Deve listar todos os admins
