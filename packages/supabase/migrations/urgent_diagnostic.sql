-- ============================================================================
-- DIAGNÓSTICO URGENTE - Execute e me envie TODOS os resultados
-- ============================================================================

-- TESTE 1: Você consegue acessar seu próprio perfil?
SELECT id, email, account_type, is_super_admin
FROM profiles
WHERE id = auth.uid();
-- Me envie: O resultado ou se deu erro

-- ============================================================================

-- TESTE 2: Verificar JWT claims
SELECT 
  current_setting('request.jwt.claims', true)::json as jwt_claims,
  current_setting('request.jwt.claims', true)::json->>'account_type' as account_type_from_jwt,
  current_setting('request.jwt.claims', true)::json->>'role' as role_from_jwt,
  auth.uid() as my_user_id;
-- Me envie: O resultado completo

-- ============================================================================

-- TESTE 3: Verificar se o usuário existe
SELECT id, email, account_type, is_super_admin, created_at
FROM profiles
WHERE id = 'fe1c0fc8-4e71-4077-85b8-901541c21bec';
-- Me envie: O resultado ou "no rows"

-- ============================================================================

-- TESTE 4: Testar acesso direto (bypassing RLS)
SET LOCAL ROLE postgres;
SELECT id, email, full_name, account_type
FROM profiles
WHERE id = 'fe1c0fc8-4e71-4077-85b8-901541c21bec';
RESET ROLE;
-- Me envie: O resultado

-- ============================================================================

-- TESTE 5: Ver TODAS as políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
-- Me envie: Screenshot ou lista completa

-- ============================================================================

-- TESTE 6: Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';
-- Me envie: O resultado

-- ============================================================================

-- TESTE 7: Testar política específica
SELECT 
  auth.uid() = 'fe1c0fc8-4e71-4077-85b8-901541c21bec'::uuid as is_my_id,
  auth.uid() as current_user_id,
  'fe1c0fc8-4e71-4077-85b8-901541c21bec'::uuid as target_id;
-- Me envie: O resultado

-- ============================================================================
-- INSTRUÇÕES
-- ============================================================================
-- Execute TODOS os 7 testes acima
-- Me envie o resultado de CADA UM
-- Se algum der erro, me envie a mensagem de erro completa
