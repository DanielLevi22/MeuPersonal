-- ============================================================================
-- SOLUÇÃO TEMPORÁRIA: Permitir acesso anônimo para leitura (APENAS TESTE)
-- ============================================================================
-- ATENÇÃO: Esta é uma solução temporária para identificar o problema
-- Vamos permitir leitura de profiles para identificar se o problema é RLS
-- ============================================================================

-- Criar política temporária que permite leitura para qualquer usuário autenticado
CREATE POLICY "temp_allow_read_for_testing"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);  -- Permite TUDO temporariamente

-- Verificar políticas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- TESTE NO APP
-- ============================================================================
-- Agora teste o app novamente
-- Se FUNCIONAR = Problema está nas expressões USING das outras políticas
-- Se NÃO FUNCIONAR = Problema é outro (não é RLS)

-- ============================================================================
-- IMPORTANTE: Depois do teste, REMOVA esta política
-- ============================================================================
-- DROP POLICY "temp_allow_read_for_testing" ON profiles;
