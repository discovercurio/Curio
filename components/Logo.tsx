import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function Logo({ size = 'medium' }: LogoProps) {
  const sizeStyles = {
    small: { width: 60, height: 20 },
    medium: { width: 90, height: 30 },
    large: { width: 120, height: 40 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/curio-logo-cropped.png')}
        style={[styles.logo, currentSize]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    // Image styling handled by size prop
  },
});