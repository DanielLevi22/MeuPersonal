-- Diagnóstico e Limpeza Completa de RLS
-- Execute este script para ver o que está causando o erro 500

-- ============================================================================
-- PARTE 1: DIAGNÓSTICO - Ver todas as policies atuais
-- ============================================================================

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

-- ============================================================================
-- PARTE 2: LIMPEZA TOTAL - Desabilitar RLS temporariamente
-- ============================================================================

-- ATENÇÃO: Isso vai DESABILITAR completamente o RLS na tabela profiles
-- Use apenas para debug!

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 3: REABILITAR RLS com policies simples
-- ============================================================================

-- Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as policies
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
  END LOOP;
END $$;

-- Criar apenas a policy essencial
CREATE POLICY "allow_own_profile"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

SELECT 
  'Policies after cleanup:' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles';
