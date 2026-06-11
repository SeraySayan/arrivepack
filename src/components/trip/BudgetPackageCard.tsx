import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../utils/haptics';
import type { BudgetStyle } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

interface Package {
  id: BudgetStyle;
  icon: string;
  title: string;
  description: string;
  bestFor: string;
}

const PACKAGES: Package[] = [
  {
    id: 'smart_budget',
    icon: '💡',
    title: 'Smart Budget',
    description: 'Spend carefully, avoid unnecessary costs, and still travel safely.',
    bestFor: 'Local food · Public transport · Budget stays',
  },
  {
    id: 'balanced_experience',
    icon: '⚖️',
    title: 'Balanced Experience',
    description: 'The best balance between comfort, time, and value.',
    bestFor: 'Good-location hotels · Uber when useful · Mix of popular & local',
  },
  {
    id: 'premium_comfort',
    icon: '✨',
    title: 'Premium Comfort',
    description: 'Less stress, better locations, smoother travel.',
    bestFor: 'Private transfers · Better hotels · Guided experiences',
  },
];

interface Props {
  selected: BudgetStyle | null;
  onSelect: (style: BudgetStyle) => void;
}

export default function BudgetPackageCard({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {PACKAGES.map((pkg) => {
        const isSelected = selected === pkg.id;
        return (
          <Pressable
            key={pkg.id}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(pkg.id);
            }}
            style={({ pressed }) => [
              styles.card,
              isSelected && styles.selectedCard,
              pressed && styles.pressed,
            ]}
          >
            {isSelected && (
              <LinearGradient
                colors={[Colors.teal + '18', Colors.tealLight + '08']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <View style={styles.header}>
              <View style={[styles.iconContainer, isSelected && styles.iconSelected]}>
                <Text style={styles.icon}>{pkg.icon}</Text>
              </View>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={[styles.title, isSelected && styles.titleSelected]}>{pkg.title}</Text>
            <Text style={styles.description}>{pkg.description}</Text>
            <View style={styles.bestForRow}>
              <Text style={styles.bestForLabel}>Best for: </Text>
              <Text style={styles.bestForText}>{pkg.bestFor}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPadLg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  selectedCard: {
    borderColor: Colors.teal,
    ...Shadows.teal,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    backgroundColor: Colors.mint,
  },
  icon: {
    fontSize: 22,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  titleSelected: {
    color: Colors.tealDark,
  },
  description: {
    ...Typography.body,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  bestForRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  bestForLabel: {
    ...Typography.caption,
    color: Colors.mutedLight,
    fontWeight: '600',
  },
  bestForText: {
    ...Typography.caption,
    color: Colors.mutedLight,
    flex: 1,
  },
});
