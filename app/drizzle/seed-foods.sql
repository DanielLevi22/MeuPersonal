-- Seed: Common Brazilian Foods Database
-- 500+ alimentos comuns brasileiros com macros baseados em TBCA

-- PROTEÍNAS
INSERT INTO foods (name, category, serving_size, serving_unit, calories, protein, carbs, fat, source) VALUES
-- Carnes
('Frango grelhado (peito)', 'Proteína', 100, 'g', 165, 31, 0, 3.6, 'TBCA'),
('Frango cozido (peito)', 'Proteína', 100, 'g', 159, 32, 0, 2.5, 'TBCA'),
('Carne bovina (patinho)', 'Proteína', 100, 'g', 163, 28, 0, 5.4, 'TBCA'),
('Carne bovina (alcatra)', 'Proteína', 100, 'g', 186, 26, 0, 8.9, 'TBCA'),
('Carne bovina (filé mignon)', 'Proteína', 100, 'g', 191, 26, 0, 9.2, 'TBCA'),
('Carne moída (magra)', 'Proteína', 100, 'g', 209, 26, 0, 11, 'TBCA'),
('Porco (lombo)', 'Proteína', 100, 'g', 143, 22, 0, 5.5, 'TBCA'),
('Peixe (tilápia)', 'Proteína', 100, 'g', 96, 20, 0, 1.7, 'TBCA'),
('Peixe (salmão)', 'Proteína', 100, 'g', 208, 20, 0, 13, 'TBCA'),
('Atum em lata (água)', 'Proteína', 100, 'g', 116, 26, 0, 0.8, 'TBCA'),
('Sardinha em lata', 'Proteína', 100, 'g', 208, 25, 0, 11, 'TBCA'),

-- Ovos e Laticínios
('Ovo inteiro cozido', 'Proteína', 50, 'unidade', 78, 6.3, 0.6, 5.3, 'TBCA'),
('Clara de ovo', 'Proteína', 33, 'unidade', 17, 3.6, 0.2, 0.1, 'TBCA'),
('Queijo cottage', 'Proteína', 100, 'g', 98, 11, 3.4, 4.3, 'TBCA'),
('Queijo minas frescal', 'Proteína', 100, 'g', 264, 17, 3.8, 20, 'TBCA'),
('Ricota', 'Proteína', 100, 'g', 140, 11, 3.4, 10, 'TBCA'),
('Iogurte grego natural', 'Proteína', 100, 'g', 59, 10, 3.6, 0.4, 'TBCA'),
('Leite desnatado', 'Proteína', 200, 'ml', 70, 6.8, 9.8, 0.4, 'TBCA'),
('Leite integral', 'Proteína', 200, 'ml', 122, 6.2, 9.2, 6.2, 'TBCA'),

-- Suplementos
('Whey protein isolado', 'Proteína', 30, 'g', 110, 25, 2, 0.5, 'Manual'),
('Whey protein concentrado', 'Proteína', 30, 'g', 120, 24, 3, 1.5, 'Manual'),
('Albumina', 'Proteína', 30, 'g', 105, 24, 1, 0.2, 'Manual'),
('Caseína', 'Proteína', 30, 'g', 115, 24, 3, 1, 'Manual');

-- CARBOIDRATOS
INSERT INTO foods (name, category, serving_size, serving_unit, calories, protein, carbs, fat, fiber, source) VALUES
-- Grãos e Cereais
('Arroz branco cozido', 'Carboidrato', 100, 'g', 128, 2.5, 28, 0.2, 0.2, 'TBCA'),
('Arroz integral cozido', 'Carboidrato', 100, 'g', 124, 2.6, 25.8, 1, 2.7, 'TBCA'),
('Macarrão cozido', 'Carboidrato', 100, 'g', 131, 4.3, 26, 0.5, 1.1, 'TBCA'),
('Macarrão integral cozido', 'Carboidrato', 100, 'g', 124, 4.5, 23.5, 1.3, 3.5, 'TBCA'),
('Aveia em flocos', 'Carboidrato', 30, 'g', 117, 4.2, 19.8, 2.4, 2.7, 'TBCA'),
('Granola', 'Carboidrato', 40, 'g', 182, 4.8, 26, 6.4, 3.2, 'TBCA'),
('Quinoa cozida', 'Carboidrato', 100, 'g', 120, 4.4, 21.3, 1.9, 2.8, 'TBCA'),

-- Pães
('Pão francês', 'Carboidrato', 50, 'unidade', 135, 4.5, 27, 1, 1.5, 'TBCA'),
('Pão integral', 'Carboidrato', 50, 'g', 126, 5, 22, 1.5, 3.5, 'TBCA'),
('Pão de forma branco', 'Carboidrato', 25, 'fatia', 66, 2.3, 12.5, 0.8, 0.5, 'TBCA'),
('Pão de forma integral', 'Carboidrato', 25, 'fatia', 63, 2.8, 11, 1.2, 2, 'TBCA'),
('Tapioca', 'Carboidrato', 50, 'g', 176, 0.1, 44, 0.1, 0.5, 'TBCA'),

-- Tubérculos
('Batata doce cozida', 'Carboidrato', 100, 'g', 77, 0.6, 18.4, 0.1, 2.2, 'TBCA'),
('Batata inglesa cozida', 'Carboidrato', 100, 'g', 52, 1.2, 11.9, 0.1, 1.3, 'TBCA'),
('Mandioca cozida', 'Carboidrato', 100, 'g', 125, 0.6, 30.1, 0.3, 1.6, 'TBCA'),
('Inhame cozido', 'Carboidrato', 100, 'g', 97, 1.5, 23.2, 0.2, 2.7, 'TBCA'),

-- Frutas
('Banana prata', 'Carboidrato', 100, 'g', 98, 1.3, 26, 0.1, 2, 'TBCA'),
('Banana nanica', 'Carboidrato', 100, 'g', 92, 1.5, 23.8, 0.1, 1.9, 'TBCA'),
('Maçã', 'Carboidrato', 100, 'g', 56, 0.3, 15, 0.1, 1.3, 'TBCA'),
('Mamão papaya', 'Carboidrato', 100, 'g', 45, 0.8, 11.6, 0.1, 1.8, 'TBCA'),
('Morango', 'Carboidrato', 100, 'g', 30, 0.9, 7.7, 0.3, 1.7, 'TBCA'),
('Abacaxi', 'Carboidrato', 100, 'g', 48, 0.9, 12.3, 0.1, 1, 'TBCA'),
('Melancia', 'Carboidrato', 100, 'g', 33, 0.9, 8.1, 0.2, 0.1, 'TBCA'),
('Uva', 'Carboidrato', 100, 'g', 50, 0.6, 13.9, 0.4, 0.4, 'TBCA');

-- GORDURAS
INSERT INTO foods (name, category, serving_size, serving_unit, calories, protein, carbs, fat, source) VALUES
-- Óleos e Gorduras
('Azeite de oliva extra virgem', 'Gordura', 10, 'ml', 90, 0, 0, 10, 'TBCA'),
('Óleo de coco', 'Gordura', 10, 'ml', 86, 0, 0, 10, 'TBCA'),
('Manteiga', 'Gordura', 10, 'g', 74, 0.1, 0.1, 8.2, 'TBCA'),

-- Oleaginosas
('Amendoim', 'Gordura', 30, 'g', 176, 7.8, 4.8, 14.4, 'TBCA'),
('Castanha de caju', 'Gordura', 30, 'g', 186, 5.1, 9.9, 15, 'TBCA'),
('Castanha do Pará', 'Gordura', 30, 'g', 206, 4.5, 3.6, 20.7, 'TBCA'),
('Amêndoas', 'Gordura', 30, 'g', 174, 6.3, 6.6, 15, 'TBCA'),
('Nozes', 'Gordura', 30, 'g', 196, 4.5, 4.2, 19.5, 'TBCA'),

-- Pastas
('Pasta de amendoim integral', 'Gordura', 20, 'g', 120, 5, 4, 10, 'Manual'),
('Pasta de castanha de caju', 'Gordura', 20, 'g', 124, 3.4, 6.6, 10, 'Manual'),
('Abacate', 'Gordura', 100, 'g', 96, 1.2, 6, 8.4, 'TBCA');

-- VEGETAIS (baixo carb)
INSERT INTO foods (name, category, serving_size, serving_unit, calories, protein, carbs, fat, fiber, source) VALUES
('Brócolis cozido', 'Vegetal', 100, 'g', 25, 2.4, 4.3, 0.4, 3.4, 'TBCA'),
('Couve-flor cozida', 'Vegetal', 100, 'g', 17, 1.8, 2.4, 0.5, 2, 'TBCA'),
('Espinafre cozido', 'Vegetal', 100, 'g', 18, 2.2, 1.4, 0.3, 2.6, 'TBCA'),
('Alface', 'Vegetal', 100, 'g', 11, 1.4, 1.7, 0.3, 1.7, 'TBCA'),
('Tomate', 'Vegetal', 100, 'g', 15, 1.1, 3.1, 0.2, 1.2, 'TBCA'),
('Pepino', 'Vegetal', 100, 'g', 10, 0.8, 2.2, 0.1, 0.5, 'TBCA'),
('Cenoura crua', 'Vegetal', 100, 'g', 34, 1.3, 7.9, 0.2, 3.2, 'TBCA'),
('Abobrinha cozida', 'Vegetal', 100, 'g', 12, 1.2, 1.4, 0.2, 1.1, 'TBCA'),
('Berinjela cozida', 'Vegetal', 100, 'g', 16, 1.1, 2.5, 0.2, 2.5, 'TBCA'),
('Chuchu cozido', 'Vegetal', 100, 'g', 15, 0.7, 3.5, 0.1, 1.7, 'TBCA'),
('Vagem cozida', 'Vegetal', 100, 'g', 26, 1.8, 5.7, 0.1, 3.2, 'TBCA');

-- LEGUMINOSAS
INSERT INTO foods (name, category, serving_size, serving_unit, calories, protein, carbs, fat, fiber, source) VALUES
('Feijão preto cozido', 'Carboidrato', 100, 'g', 77, 4.5, 14, 0.5, 8.4, 'TBCA'),
('Feijão carioca cozido', 'Carboidrato', 100, 'g', 76, 4.8, 13.6, 0.5, 8.5, 'TBCA'),
('Lentilha cozida', 'Carboidrato', 100, 'g', 93, 6.3, 16.3, 0.4, 7.9, 'TBCA'),
('Grão de bico cozido', 'Carboidrato', 100, 'g', 121, 6.8, 18.2, 2.1, 5.4, 'TBCA'),
('Ervilha cozida', 'Carboidrato', 100, 'g', 63, 5.4, 9.3, 0.2, 5.5, 'TBCA');

-- Nota: Este é um subset de ~100 alimentos. 
-- Para produção, expandir para 500+ alimentos comuns.
