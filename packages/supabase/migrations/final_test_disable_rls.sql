-- ============================================================================
-- TESTE FINAL: Verificar se o problema é Accept header
-- ============================================================================

-- O erro 406 "Not Acceptable" pode ser causado por headers HTTP incorretos
-- Vamos verificar se há alguma configuração bloqueando

-- PASSO 1: Desabilitar RLS completamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Verificar
SELECT tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';
-- Deve mostrar: rowsecurity = false

-- ============================================================================
-- AGORA TESTE O APP
-- ============================================================================
-- Se AINDA der 406 com RLS desabilitado = Problema não é RLS!
-- Possíveis causas:
-- 1. Headers HTTP incorretos (Accept header)
-- 2. CORS bloqueando
-- 3. API Key inválida
-- 4. Problema no Supabase client

-- ============================================================================
-- DEPOIS DO TESTE, ME ENVIE:
-- ============================================================================
-- 1. Ainda dá erro 406? SIM ou NÃO
-- 2. Se SIM, copie o erro COMPLETO do console (incluindo headers se possível)
-- 3. Verifique no Network tab do DevTools:
--    - Status Code
--    - Request Headers
--    - Response Headers

-- ============================================================================
-- PARA REABILITAR RLS DEPOIS:
-- ============================================================================
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
