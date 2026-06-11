import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}

export default function SectionHeader({ title, subtitle, actionLabel, onAction, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  left: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.muted,
    marginTop: 2,
  },
  action: {
    paddingLeft: Spacing.sm,
  },
  actionText: {
    ...Typography.bodySm,
    color: Colors.teal,
    fontWeight: '600',
  },
});
