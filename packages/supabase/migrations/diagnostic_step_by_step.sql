-- ============================================================================
-- TESTE DIRETO - Execute linha por linha e me envie os resultados
-- ============================================================================

-- TESTE 1: Verificar se você consegue acessar seu próprio perfil
-- (Execute logado no Dashboard)
SELECT id, email, account_type, is_super_admin
FROM profiles
WHERE id = auth.uid();

-- RESULTADO ESPERADO: Deve retornar SEU perfil
-- Se retornar VAZIO ou ERRO = Problema nas políticas RLS

-- ============================================================================

-- TESTE 2: Verificar políticas atuais
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- RESULTADO ESPERADO: Deve mostrar as 6 políticas
-- Se mostrar MENOS = Políticas não foram criadas
-- Se mostrar MAIS = Políticas duplicadas

-- ============================================================================

-- TESTE 3: Verificar função is_admin()
SELECT pg_get_functiondef('is_admin()'::regprocedure);

-- RESULTADO ESPERADO: Deve mostrar função usando current_setting('request.jwt.claims'...)
-- Se mostrar SELECT FROM profiles = Função ainda está errada (recursão)

-- ============================================================================

-- TESTE 4: Testar função is_admin() diretamente
SELECT is_admin() as sou_admin;

-- RESULTADO ESPERADO: 
-- - Se você for admin: true
-- - Se não for admin: false
-- Se der ERRO = Função está quebrada

-- ============================================================================

-- TESTE 5: Verificar se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- RESULTADO ESPERADO: rowsecurity = true
-- Se false = RLS não está habilitado

-- ============================================================================

-- TESTE 6: Desabilitar RLS temporariamente (APENAS PARA TESTE)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Agora tente acessar o app novamente
-- Se FUNCIONAR = Problema está nas políticas RLS
-- Se NÃO FUNCIONAR = Problema é outro

-- IMPORTANTE: Depois do teste, REABILITE RLS:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================

-- TESTE 7: Ver o JWT atual
SELECT 
  current_setting('request.jwt.claims', true)::json as jwt_claims,
  current_setting('request.jwt.claims', true)::json->>'account_type' as account_type_from_jwt;

-- RESULTADO ESPERADO: Deve mostrar seus claims JWT incluindo account_type
-- Se account_type_from_jwt for NULL = Hook JWT não está funcionando

-- ============================================================================
-- INSTRUÇÕES
-- ============================================================================

-- Execute cada TESTE acima e me envie:
-- 1. O resultado de cada query
-- 2. Se deu erro, qual foi o erro exato
-- 3. Resultado do TESTE 6 (app funcionou com RLS desabilitado?)

-- Com essas informações vou identificar exatamente onde está o problema!
