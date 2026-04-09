export const Alert = {
  alert: jest.fn(),
};

export const Platform = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
};

export const Dimensions = {
  get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
};

export const View = 'View';
export const Text = 'Text';
export const Image = 'Image';
export const ScrollView = 'ScrollView';
export const TextInput = 'TextInput';
export const TouchableOpacity = 'TouchableOpacity';
export const FlatList = 'FlatList';
export const ActivityIndicator = 'ActivityIndicator';
export const StyleSheet = { create: (obj) => obj };

export default {
  Alert,
  Platform,
  Dimensions,
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
};
