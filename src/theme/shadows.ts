import { Platform } from 'react-native';

const shadow = (
  elevation: number,
  color = '#0F172A',
  opacity = 0.08,
  radius = 8,
  offsetY = 2
) =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
    default: {},
  });

export const Shadows = {
  none: {},
  xs: shadow(2, '#0F172A', 0.05, 4, 1),
  sm: shadow(4, '#0F172A', 0.07, 8, 2),
  md: shadow(8, '#0F172A', 0.09, 12, 4),
  lg: shadow(12, '#0F172A', 0.12, 20, 6),
  xl: shadow(16, '#0F172A', 0.15, 28, 8),
  teal: shadow(8, '#14B8A6', 0.25, 12, 4),
  coral: shadow(8, '#FF6B5E', 0.25, 12, 4),
};
