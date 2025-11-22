import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time: string) => void;
}

// Generate hours 00-23
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
// Generate minutes 00-59
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export function TimePickerModal({ visible, onClose, onSelectTime }: TimePickerModalProps) {
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');

  const handleConfirm = () => {
    onSelectTime(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Selecionar Horário</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Picker Columns */}
          <View style={styles.pickerContainer}>
            {/* Hours */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Horas</Text>
              <ScrollView
                style={styles.scrollList}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {HOURS.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeItem,
                      selectedHour === hour && styles.selectedItem,
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selectedHour === hour && styles.selectedText,
                      ]}
                    >
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.separator}>:</Text>

            {/* Minutes */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Minutos</Text>
              <ScrollView
                style={styles.scrollList}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {MINUTES.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeItem,
                      selectedMinute === minute && styles.selectedItem,
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selectedMinute === minute && styles.selectedText,
                      ]}
                    >
                      {minute}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Confirm Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Confirmar Horário</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A0E1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '60%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  column: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  columnLabel: {
    color: '#8B92A8',
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '600',
  },
  scrollList: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 60, // Add padding to center items
  },
  timeItem: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 4,
    width: 80,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#141B2D',
    borderWidth: 1,
    borderColor: '#00FF88',
  },
  timeText: {
    fontSize: 24,
    color: '#5A6178',
    fontWeight: '600',
  },
  selectedText: {
    color: '#00FF88',
    fontWeight: '800',
    fontSize: 28,
  },
  separator: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: '800',
    marginHorizontal: 10,
    marginBottom: 20,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1E2A42',
  },
  confirmButton: {
    backgroundColor: '#00FF88',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#0A0E1A',
    fontSize: 16,
    fontWeight: '700',
  },
});
