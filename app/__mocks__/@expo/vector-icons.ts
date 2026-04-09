import React from 'react';
import { Text } from 'react-native';

export const Ionicons = (props: Record<string, unknown>) =>
  React.createElement(Text, props, 'Icon');
export const MaterialIcons = (props: Record<string, unknown>) =>
  React.createElement(Text, props, 'Icon');

export default {
  Ionicons,
  MaterialIcons,
};
