import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

const { width } = Dimensions.get('window');

interface Props {
  message: string;
  visible: boolean;
  emoji?: string;
}

export default function AppToast({ message, visible, emoji = '✅' }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 20, duration: 300, useNativeDriver: true }),
        ]).start();
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: Colors.deepNavy,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: width - 40,
    ...Shadows.lg,
  },
  emoji: {
    fontSize: 16,
  },
  message: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
