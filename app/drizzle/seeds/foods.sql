-- Seed: alimentos básicos
-- Macros por 100g. serving_size em gramas.
-- Fonte de referência: TACO (Tabela Brasileira de Composição de Alimentos)

insert into foods (name, category, calories, protein, carbs, fat, fiber, serving_size) values

-- Proteínas animais
('Frango (peito grelhado)',    'proteina', 159, 32.0, 0.0,  2.7,  0.0,  100),
('Carne bovina (patinho)',     'proteina', 219, 28.0, 0.0,  11.6, 0.0,  100),
('Ovo inteiro cozido',        'proteina', 146, 13.0, 0.6,  9.9,  0.0,  50),
('Clara de ovo',              'proteina', 48,  11.1, 0.7,  0.2,  0.0,  30),
('Atum em água (lata)',       'proteina', 109, 24.4, 0.0,  0.9,  0.0,  130),
('Salmão grelhado',           'proteina', 208, 28.0, 0.0,  10.0, 0.0,  100),
('Tilápia grelhada',          'proteina', 128, 26.0, 0.0,  2.7,  0.0,  100),
('Whey protein (pó)',         'proteina', 380, 75.0, 7.0,  5.0,  0.0,  30),

-- Proteínas vegetais / laticínios
('Cottage',                   'laticinios', 98,  11.1, 3.4,  4.3,  0.0,  100),
('Iogurte grego natural',     'laticinios', 97,  9.0,  3.6,  5.0,  0.0,  170),
('Queijo minas frescal',      'laticinios', 264, 17.4, 3.0,  20.2, 0.0,  30),
('Leite desnatado',           'laticinios', 35,  3.4,  4.9,  0.2,  0.0,  240),

-- Carboidratos
('Arroz branco cozido',       'carboidrato', 128, 2.5,  28.1, 0.2,  0.3,  150),
('Arroz integral cozido',     'carboidrato', 124, 2.6,  25.8, 1.0,  1.8,  150),
('Batata doce cozida',        'carboidrato', 77,  1.4,  17.6, 0.1,  2.2,  130),
('Macarrão integral cozido',  'carboidrato', 124, 5.3,  25.0, 0.9,  3.9,  140),
('Pão integral',              'carboidrato', 253, 8.1,  48.0, 3.1,  6.9,  30),
('Aveia em flocos',           'carboidrato', 394, 13.9, 67.0, 8.5,  9.1,  40),
('Mandioca cozida',           'carboidrato', 125, 0.6,  30.1, 0.3,  1.9,  100),
('Quinoa cozida',             'carboidrato', 120, 4.4,  21.3, 1.9,  2.8,  185),

-- Gorduras boas
('Azeite de oliva',           'gordura', 884, 0.0,  0.0,  100.0, 0.0, 10),
('Abacate',                   'gordura', 160, 2.0,  8.5,  14.7, 6.7,  100),
('Amendoim torrado',          'gordura', 581, 27.7, 19.8, 47.5, 6.5,  30),
('Pasta de amendoim',         'gordura', 589, 25.1, 19.6, 49.9, 6.0,  30),
('Castanha do Pará',          'gordura', 643, 14.3, 12.3, 63.5, 7.9,  30),

-- Vegetais
('Brócolis cozido',           'vegetal', 35,  2.4,  7.2,  0.4,  2.6,  80),
('Espinafre cru',             'vegetal', 23,  2.9,  3.6,  0.4,  2.2,  30),
('Tomate',                    'vegetal', 15,  0.8,  2.9,  0.3,  1.2,  120),
('Alface',                    'vegetal', 11,  1.3,  1.0,  0.2,  1.8,  50),
('Cenoura crua',              'vegetal', 34,  0.9,  7.3,  0.2,  2.8,  80),
('Pepino',                    'vegetal', 13,  0.7,  2.4,  0.1,  0.7,  100),
('Chuchu cozido',             'vegetal', 20,  0.9,  4.5,  0.1,  1.5,  100),
('Couve refogada',            'vegetal', 41,  3.1,  5.1,  1.5,  2.9,  60),

-- Frutas
('Banana',                    'fruta', 98,  1.3,  26.0, 0.1,  2.0,  100),
('Maçã',                      'fruta', 52,  0.3,  13.8, 0.2,  2.4,  130),
('Laranja',                   'fruta', 37,  0.9,  8.9,  0.1,  1.8,  130),
('Mamão papaia',              'fruta', 45,  0.6,  11.8, 0.1,  1.8,  150),
('Morango',                   'fruta', 32,  0.7,  7.7,  0.3,  2.0,  100),
('Uva',                       'fruta', 69,  0.6,  18.1, 0.2,  0.9,  100),

-- Leguminosas
('Feijão carioca cozido',     'leguminosa', 76,  4.8,  13.6, 0.5,  8.4,  100),
('Feijão preto cozido',       'leguminosa', 77,  5.1,  14.0, 0.5,  8.7,  100),
('Lentilha cozida',           'leguminosa', 116, 9.0,  20.1, 0.4,  7.9,  100),
('Grão de bico cozido',       'leguminosa', 164, 8.9,  27.4, 2.6,  7.6,  100),
('Edamame',                   'leguminosa', 122, 11.9, 8.9,  5.2,  5.2,  100);
