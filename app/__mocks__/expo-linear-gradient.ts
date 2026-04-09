import React from 'react';
import { View } from 'react-native';

export const LinearGradient = ({ children, ...props }: any) => {
  return React.createElement(View, props, children);
};

export default {
  LinearGradient,
};
