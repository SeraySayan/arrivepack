import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { DESTINATIONS } from '../../src/data/egypt';
import AppButton from '../../src/components/ui/AppButton';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';

export default function DestinationScreen() {
  const [selected, setSelected] = useState<string | null>('egypt');

  const handleNext = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/onboarding/duration', params: { destinationId: selected } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.progress}>
          {[1, 2, 3, 4].map((step) => (
            <View key={step} style={[styles.progressDot, step === 1 && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 1 of 4</Text>
        <Text style={styles.title}>Where are you going?</Text>
        <Text style={styles.subtitle}>Select your destination pack.</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {DESTINATIONS.map((dest) => {
          const isSelected = selected === dest.id;
          return (
            <Pressable
              key={dest.id}
              onPress={() => {
                if (!dest.isAvailable) return;
                Haptics.selectionAsync();
                setSelected(dest.id);
              }}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                !dest.isAvailable && styles.cardDisabled,
                pressed && dest.isAvailable && styles.pressed,
              ]}
            >
              <Text style={styles.cardEmoji}>{dest.emoji}</Text>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardName, !dest.isAvailable && styles.textMuted]}>
                    {dest.name}
                  </Text>
                  {dest.badge && (
                    <View style={[styles.badge, isSelected && styles.badgeSelected, !dest.isAvailable && styles.badgeMuted]}>
                      <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                        {dest.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cardSubtitle, !dest.isAvailable && styles.textMuted]}>
                  {dest.subtitle}
                </Text>
                <Text style={[styles.cardDesc, !dest.isAvailable && styles.textMuted]} numberOfLines={1}>
                  {dest.coverDescription}
                </Text>
              </View>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          label="Next: Duration →"
          onPress={handleNext}
          disabled={!selected}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
    gap: Spacing.xs,
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  progressDot: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.teal,
  },
  stepLabel: {
    ...Typography.captionBold,
    color: Colors.teal,
    marginBottom: 2,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.muted,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.xs,
  },
  cardSelected: {
    borderColor: Colors.teal,
    ...Shadows.teal,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardEmoji: {
    fontSize: 32,
    width: 48,
    textAlign: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  cardName: {
    ...Typography.h4,
    color: Colors.text,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.muted,
  },
  cardDesc: {
    ...Typography.caption,
    color: Colors.mutedLight,
    marginTop: 1,
  },
  textMuted: {
    color: Colors.mutedLight,
  },
  badge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeSelected: {
    backgroundColor: Colors.mint,
  },
  badgeMuted: {
    backgroundColor: Colors.borderLight,
  },
  badgeText: {
    ...Typography.label,
    color: Colors.muted,
    fontSize: 9,
  },
  badgeTextSelected: {
    color: Colors.tealDark,
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
  footer: {
    padding: Spacing.screenH,
    paddingBottom: Spacing.xl,
  },
});
