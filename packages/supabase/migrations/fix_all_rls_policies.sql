-- ============================================================================
-- DIAGNÓSTICO E CORREÇÃO COMPLETA DE RLS
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================================

-- PASSO 1: Ver todas as políticas atuais da tabela profiles
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- PASSO 2: Remover TODAS as políticas existentes (reset completo)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete users (not super admins)" ON profiles;

-- PASSO 3: Recriar políticas na ordem correta

-- 3.1: Políticas para usuários normais (self-access)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3.2: Políticas para admins (acesso total)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete users (not super admins)"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    is_admin() 
    AND NOT is_super_admin
  );

-- PASSO 4: Verificar se RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Verificar resultado
SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Deve mostrar 6 políticas:
-- 1. Admins can delete users (not super admins) - DELETE
-- 2. Admins can update any profile - UPDATE
-- 3. Admins can view all profiles - SELECT
-- 4. Users can insert own profile - INSERT
-- 5. Users can update own profile - UPDATE
-- 6. Users can view own profile - SELECT
