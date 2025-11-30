-- ============================================================================
-- SOLUÇÃO ALTERNATIVA: Políticas RLS Simples (Sem is_admin())
-- ============================================================================
-- Esta solução usa JWT claims diretamente nas políticas,
-- evitando completamente a função is_admin() que pode estar causando problemas
-- ============================================================================

-- PASSO 1: Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete users (not super admins)" ON profiles;

-- PASSO 2: Criar políticas usando JWT claims diretamente

-- 2.1: Usuários podem ver e editar seu próprio perfil
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

-- 2.2: Admins podem ver todos os perfis (usando JWT claims diretamente)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'account_type',
      ''
    ) = 'admin'
  );

-- 2.3: Admins podem atualizar qualquer perfil
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'account_type',
      ''
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'account_type',
      ''
    ) = 'admin'
  );

-- 2.4: Admins podem deletar usuários (exceto super admins)
CREATE POLICY "Admins can delete users (not super admins)"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'account_type',
      ''
    ) = 'admin'
    AND NOT is_super_admin
  );

-- PASSO 3: Garantir que RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Verificar resultado
SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- VANTAGENS DESTA SOLUÇÃO
-- ============================================================================
-- 1. Não depende da função is_admin() (evita recursão)
-- 2. Usa JWT claims diretamente (mais rápido)
-- 3. Funciona mesmo se o hook JWT falhar (fallback para usuário normal)
-- 4. Mais simples de debugar

-- ============================================================================
-- IMPORTANTE
-- ============================================================================
-- Esta solução ainda requer que o Hook JWT esteja configurado!
-- Caso contrário, admins não terão acesso especial.
-- Mas usuários normais SEMPRE conseguirão acessar seus próprios dados.
