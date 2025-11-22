# 🐛 Debug - Date Picker não abre

## Problema
O date picker não está abrindo quando clica no botão.

## ✅ Migration executada
Você já rodou a migration no banco! Ótimo!

## 🔍 Código de Debug para Adicionar

Substitua o código do **Start Date** (linha ~216) por este:

```tsx
              {/* Start Date */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data de Início</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    console.log('📅 BOTÃO CLICADO! showStartPicker antes:', showStartPicker);
                    setShowStartPicker(true);
                    console.log('📅 setShowStartPicker(true) chamado');
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color="#00D9FF" />
                  <Text style={styles.dateButtonText}>
                    {startDate.toLocaleDateString('pt-BR')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#8B92A8" />
                </TouchableOpacity>
                
                <Text style={{color: 'yellow', marginTop: 8}}>
                  DEBUG: showStartPicker = {showStartPicker ? 'TRUE' : 'FALSE'}
                </Text>
                
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      console.log('📅 onChange chamado! event.type:', event.type);
                      setShowStartPicker(false);
                      if (selectedDate && event.type === 'set') {
                        setStartDate(selectedDate);
                        console.log('📅 Data atualizada para:', selectedDate);
                      }
                    }}
                  />
                )}
              </View>
```

## 📊 O que esperar

Quando clicar no botão, você deve ver no terminal:
1. `📅 BOTÃO CLICADO! showStartPicker antes: false`
2. `📅 setShowStartPicker(true) chamado`
3. Na tela deve aparecer "DEBUG: showStartPicker = TRUE" em amarelo
4. O calendário do Android deve abrir

## 🎯 Possíveis problemas

### Se não aparecer NADA no console:
- O botão não está sendo clicado
- Pode ter outro elemento por cima bloqueando o toque
- Verifique se o `styles.dateButton` está correto

### Se aparecer no console mas não abrir o picker:
- O `DateTimePicker` não está sendo renderizado
- Pode ser problema de permissão ou biblioteca não linkada corretamente

### Se abrir mas fechar imediatamente:
- O `onChange` está sendo chamado automaticamente
- Isso é normal no Android, mas deve funcionar

## 💡 Teste rápido

Adicione este botão temporário para testar:

```tsx
<TouchableOpacity 
  style={{backgroundColor: 'red', padding: 20, margin: 20}}
  onPress={() => {
    console.log('🔴 TESTE: Botão vermelho clicado!');
    setShowStartPicker(true);
  }}
>
  <Text style={{color: 'white'}}>TESTE - Abrir Picker</Text>
</TouchableOpacity>
```

Se esse botão funcionar, o problema é com o estilo do `dateButton`.
