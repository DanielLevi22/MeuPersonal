import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface StudentMultiSelectProps {
  students: Student[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function StudentMultiSelect({ students, selectedIds, onSelectionChange }: StudentMultiSelectProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter(student =>
    (student.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStudent = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onSelectionChange(students.map(s => s.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const selectedStudents = students.filter(s => selectedIds.includes(s.id));

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={{
          backgroundColor: '#141B2D',
          borderWidth: 2,
          borderColor: '#1E2A42',
          borderRadius: 16,
          padding: 16,
          minHeight: 56
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            {selectedIds.length === 0 ? (
              <Text style={{ color: '#5A6178', fontSize: 16 }}>
                Selecionar alunos (opcional)
              </Text>
            ) : (
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
                  {selectedIds.length} {selectedIds.length === 1 ? 'aluno selecionado' : 'alunos selecionados'}
                </Text>
                <Text style={{ color: '#8B92A8', fontSize: 12 }} numberOfLines={1}>
                  {selectedStudents.map(s => s.full_name || 'Sem nome').join(', ')}
                </Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-down" size={20} color="#8B92A8" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
          justifyContent: 'flex-end' 
        }}>
          <View style={{ 
            backgroundColor: '#0A0E1A', 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24,
            maxHeight: '80%'
          }}>
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: 24,
              borderBottomWidth: 1,
              borderBottomColor: '#1E2A42'
            }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                Selecionar Alunos
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color="#8B92A8" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={{ padding: 16 }}>
              <View style={{
                backgroundColor: '#141B2D',
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                marginBottom: 12
              }}>
                <Ionicons name="search" size={20} color="#8B92A8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar aluno..."
                  placeholderTextColor="#5A6178"
                  style={{
                    flex: 1,
                    color: '#FFFFFF',
                    fontSize: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 12
                  }}
                />
              </View>

              {/* Select All / Clear All */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={selectAll}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 217, 255, 0.1)',
                    borderWidth: 1,
                    borderColor: '#00D9FF',
                    borderRadius: 8,
                    paddingVertical: 8,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#00D9FF', fontSize: 13, fontWeight: '600' }}>
                    Selecionar Todos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={clearAll}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255, 59, 59, 0.1)',
                    borderWidth: 1,
                    borderColor: '#FF3B3B',
                    borderRadius: 8,
                    paddingVertical: 8,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#FF3B3B', fontSize: 13, fontWeight: '600' }}>
                    Limpar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Student List */}
            <ScrollView style={{ maxHeight: 400 }}>
              {filteredStudents.length === 0 ? (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Ionicons name="people-outline" size={48} color="#5A6178" style={{ marginBottom: 12 }} />
                  <Text style={{ color: '#8B92A8', textAlign: 'center' }}>
                    {searchQuery ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                  </Text>
                </View>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedIds.includes(student.id);
                  return (
                    <TouchableOpacity
                      key={student.id}
                      onPress={() => toggleStudent(student.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: '#1E2A42',
                        backgroundColor: isSelected ? 'rgba(0, 217, 255, 0.05)' : 'transparent'
                      }}
                    >
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: isSelected ? '#00D9FF' : '#5A6178',
                        backgroundColor: isSelected ? '#00D9FF' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#0A0E1A" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 2 }}>
                          {student.full_name || 'Sem nome'}
                        </Text>
                        <Text style={{ color: '#8B92A8', fontSize: 13 }}>
                          {student.email}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Footer */}
            <View style={{ 
              padding: 16, 
              borderTopWidth: 1, 
              borderTopColor: '#1E2A42' 
            }}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={{
                  backgroundColor: '#00D9FF',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#0A0E1A', fontSize: 16, fontWeight: '700' }}>
                  Confirmar ({selectedIds.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
