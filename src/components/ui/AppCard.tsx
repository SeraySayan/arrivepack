import React from 'react';
import { Pressable, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from '../../utils/haptics';
import { Colors } from '../../theme/colors';
import { Radii, Spacing } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  noShadow?: boolean;
}

export default function AppCard({ children, onPress, style, padding, noShadow = false }: Props) {
  const handlePress = () => {
    if (onPress) {
      Haptics.selectionAsync();
      onPress();
    }
  };

  const cardStyle = [
    styles.card,
    !noShadow && Shadows.sm,
    padding !== undefined && { padding },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
