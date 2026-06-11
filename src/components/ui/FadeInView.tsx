import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle, StyleProp } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  /** Delay before the entrance starts (ms). Use to stagger a list. */
  delay?: number;
  /** Vertical offset the content rises from (px). */
  offset?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Lightweight entrance animation — fades + rises content into place.
 * Uses the native driver so it stays smooth on device and web.
 */
export default function FadeInView({
  children,
  delay = 0,
  offset = 16,
  duration = 500,
  style,
}: FadeInViewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [delay, duration, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [offset, 0],
  });

  return (
    <Animated.View style={[{ opacity: progress, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
