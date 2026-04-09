-- Query para verificar a estrutura das periodizações e suas relações

-- 1. Ver as colunas da tabela training_periodizations
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'training_periodizations'
ORDER BY ordinal_position;

-- 2. Ver as foreign keys da tabela training_periodizations
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'training_periodizations';

-- 3. Ver uma periodização de exemplo com seus dados
SELECT 
    tp.id,
    tp.name,
    tp.student_id,
    tp.professional_id,
    p.full_name as student_name,
    (SELECT COUNT(*) FROM training_plans WHERE periodization_id = tp.id) as phase_count
FROM training_periodizations tp
LEFT JOIN profiles p ON tp.student_id = p.id
LIMIT 3;
