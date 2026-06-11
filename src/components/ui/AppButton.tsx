import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../utils/haptics';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.pressable,
          fullWidth && styles.fullWidth,
          { opacity: pressed || disabled ? 0.7 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={[Colors.teal, Colors.tealDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryLabel}>{label}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const variantStyles = {
    secondary: { bg: Colors.cardWhite, border: Colors.border, textColor: Colors.text },
    outline: { bg: 'transparent', border: Colors.teal, textColor: Colors.teal },
    ghost: { bg: 'transparent', border: 'transparent', textColor: Colors.teal },
    danger: { bg: Colors.coralLight, border: Colors.coral, textColor: Colors.coral },
  };

  const vs = variantStyles[variant as keyof typeof variantStyles];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.pressable,
        styles.base,
        fullWidth && styles.fullWidth,
        { backgroundColor: vs.bg, borderColor: vs.border, borderWidth: 1.5 },
        { opacity: pressed || disabled ? 0.7 : 1 },
        ...(variant === 'secondary' ? [Shadows.sm] : []),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.textColor} size="small" />
      ) : (
        <Text style={[styles.baseLabel, { color: vs.textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
  },
  primaryLabel: {
    ...Typography.h4,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  base: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseLabel: {
    ...Typography.h4,
    fontWeight: '600',
  },
});
