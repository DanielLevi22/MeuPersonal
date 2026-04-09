import React from 'react';
import { View } from 'react-native';

interface LinearGradientProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const LinearGradient = ({ children, ...props }: LinearGradientProps) => {
  return React.createElement(View, props, children);
};

export default {
  LinearGradient,
};
