# Guia de Migration - Account Status

**Data**: 25/11/2025  
**Versão**: 1.0  
**Migration File**: `packages/supabase/migrations/20241125_add_account_status.sql`

---

## 📋 Objetivo

Adicionar sistema de aprovação de profissionais através da coluna `account_status` na tabela `profiles`.

---

## 🎯 O que essa Migration faz

### 1. Cria o Tipo ENUM `account_status`

```sql
CREATE TYPE account_status AS ENUM (
  'pending',    -- Aguardando aprovação do admin
  'active',     -- Aprovado e com acesso total
  'rejected',   -- Rejeitado pelo admin
  'suspended'   -- Suspenso temporariamente
);
```

### 2. Adiciona Coluna na Tabela `profiles`

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'pending';
```

### 3. Atualiza Usuários Existentes

```sql
-- Garante que todos os usuários existentes fiquem como 'active'
-- para não perderem acesso após a migration
UPDATE profiles SET account_status = 'active' WHERE account_status = 'pending';
```

### 4. Atualiza Trigger `handle_new_user()`

A função trigger é atualizada para definir automaticamente o status correto ao criar novos usuários:

- **Profissionais** → `pending` (precisam de aprovação)
- **Alunos e Admins** → `active` (acesso imediato)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, account_type, account_status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'account_type', 'student'),
    CASE 
      WHEN (new.raw_user_meta_data->>'account_type') = 'professional' THEN 'pending'::account_status
      ELSE 'active'::account_status
    END
  );
  RETURN new;
END;
$$;
```

---

## 🚀 Como Aplicar a Migration

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo do arquivo `packages/supabase/migrations/20241125_add_account_status.sql`
5. Clique em **Run** ou pressione `Ctrl+Enter`

### Opção 2: Via Supabase CLI (Se disponível)

```bash
# Na raiz do projeto
supabase db push

# Ou aplicar migration específica
supabase migration up
```

---

## ✅ Verificação Pós-Migration

Execute estas queries para verificar se a migration foi aplicada corretamente:

### 1. Verificar se o tipo ENUM foi criado

```sql
SELECT typname, enumlabel 
FROM pg_type 
JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid 
WHERE typname = 'account_status';
```

**Resultado esperado:**
```
typname         | enumlabel
----------------|----------
account_status  | pending
account_status  | active
account_status  | rejected
account_status  | suspended
```

### 2. Verificar se a coluna foi adicionada

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'account_status';
```

**Resultado esperado:**
```
column_name    | data_type      | column_default
---------------|----------------|----------------
account_status | account_status | 'pending'::account_status
```

### 3. Verificar status dos usuários existentes

```sql
SELECT account_type, account_status, COUNT(*) as total
FROM profiles
GROUP BY account_type, account_status
ORDER BY account_type, account_status;
```

**Resultado esperado:**
- Todos os usuários existentes devem estar com `account_status = 'active'`

### 4. Testar a função trigger

```sql
-- Verificar se a função existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

---

## 🔄 Rollback (Se necessário)

Caso precise reverter a migration:

```sql
-- 1. Remover a coluna
ALTER TABLE profiles DROP COLUMN IF EXISTS account_status;

-- 2. Remover o tipo ENUM
DROP TYPE IF EXISTS account_status;

-- 3. Restaurar função trigger original (se necessário)
-- (Você precisará ter backup da versão anterior)
```

> ⚠️ **ATENÇÃO**: Fazer rollback irá apagar todos os dados de `account_status`. Faça backup antes!

---

## 📊 Impacto da Migration

### Tabelas Afetadas
- ✅ `profiles` - Adicionada coluna `account_status`

### Funções Afetadas
- ✅ `handle_new_user()` - Atualizada para definir status baseado em `account_type`

### Triggers Afetados
- ✅ Trigger de criação de usuário (usa `handle_new_user()`)

### Usuários Existentes
- ✅ Todos definidos como `active` automaticamente
- ✅ Nenhum usuário perde acesso

### Novos Usuários (Após Migration)
- 🔵 **Profissionais**: Status `pending` (precisam de aprovação)
- 🟢 **Alunos**: Status `active` (acesso imediato)
- 🟢 **Admins**: Status `active` (acesso imediato)

---

## 🔐 Segurança e RLS

### Políticas RLS Recomendadas

Após aplicar a migration, considere atualizar as RLS policies:

```sql
-- Profissionais só podem acessar se status = 'active'
DROP POLICY IF EXISTS "Professionals can view own profile" ON profiles;
CREATE POLICY "Professionals can view own profile" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    AND (account_type != 'professional' OR account_status = 'active')
  );

-- Admins podem ver todos os perfis (incluindo pending)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- Apenas admins podem atualizar account_status
DROP POLICY IF EXISTS "Admins can update account_status" ON profiles;
CREATE POLICY "Admins can update account_status" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );
```

---

## 📝 Notas Importantes

1. **Backup**: Sempre faça backup do banco antes de aplicar migrations em produção
2. **Testes**: Teste a migration em ambiente de desenvolvimento primeiro
3. **Usuários Existentes**: A migration garante que ninguém perde acesso
4. **Novos Profissionais**: Após a migration, novos profissionais precisarão de aprovação admin
5. **Comunicação**: Informe os usuários sobre a mudança no fluxo de registro

---

## 🔗 Arquivos Relacionados

- **Migration**: `packages/supabase/migrations/20241125_add_account_status.sql`
- **Types**: `packages/supabase/src/types.ts` (adicionado `AccountStatus`)
- **Documentação**: `docs/professional_approval_system.md`
- **Implementation Plan**: `.gemini/antigravity/brain/.../implementation_plan.md`

---

## 📞 Suporte

Se encontrar problemas ao aplicar a migration:

1. Verifique os logs de erro no Supabase Dashboard
2. Confirme que a tabela `profiles` existe
3. Verifique se há conflitos com migrations anteriores
4. Consulte a documentação completa em `docs/professional_approval_system.md`

---

**Última Atualização**: 25/11/2025  
**Status**: ✅ Pronto para aplicação  
**Testado**: ⏳ Aguardando aplicação
