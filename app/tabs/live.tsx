import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import FadeInView from '../../src/components/ui/FadeInView';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import type { RescueScenario } from '../../src/types';
import { RESCUE_SCENARIOS } from '../../src/data/mockRescue';

const SCENARIOS = Object.entries(RESCUE_SCENARIOS) as [
  RescueScenario,
  typeof RESCUE_SCENARIOS[RescueScenario]
][];

const CARD_GRADIENTS = [
  ['#14B8A6', '#0D9488'],
  ['#3B82F6', '#2563EB'],
  ['#FF6B5E', '#F97316'],
  ['#FBBF24', '#F59E0B'],
  ['#A855F7', '#7C3AED'],
  ['#2DD4BF', '#0EA5A0'],
] as const;

export default function LiveScreen() {
  /* Pulsing energy ring behind the bolt */
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <LinearGradient
          colors={['#0F172A', '#10302E', '#134E4A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlow} />

          <View style={styles.boltWrap}>
            <Animated.View
              style={[styles.boltPulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
            />
            <View style={styles.boltBubble}>
              <Text style={styles.heroEmoji}>⚡</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Plans change.</Text>
          <Text style={[styles.heroTitle, { color: Colors.tealLight }]}>
            We'll help you recover.
          </Text>
          <Text style={styles.heroSub}>
            Tell us what happened. We'll suggest the next best move instantly.
          </Text>
        </LinearGradient>

        {/* Headline */}
        <FadeInView delay={60}>
          <Text style={styles.scenarioHeadline}>What happened?</Text>
          <Text style={styles.scenarioSub}>Tap the situation that best describes it.</Text>
        </FadeInView>

        {/* Scenario grid */}
        <View style={styles.grid}>
          {SCENARIOS.map(([id, scenario], i) => (
            <FadeInView key={id} delay={120 + i * 60} style={styles.gridItem}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({ pathname: '/live/alternatives', params: { scenario: id } });
                }}
                style={({ pressed }) => [styles.scenarioCard, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={CARD_GRADIENTS[i % CARD_GRADIENTS.length]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scenarioIcon}
                >
                  <Text style={styles.scenarioEmoji}>{scenario.emoji}</Text>
                </LinearGradient>
                <Text style={styles.scenarioLabel}>{scenario.label}</Text>
                <Text style={styles.scenarioDesc} numberOfLines={1}>
                  {scenario.description}
                </Text>
              </Pressable>
            </FadeInView>
          ))}
        </View>

        {/* Tip card */}
        <FadeInView delay={260}>
          <LinearGradient
            colors={['#0F172A', '#15302E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipCard}
          >
            <Text style={styles.tipTitle}>💡 How Live Mode works</Text>
            <Text style={styles.tipText}>
              Select a scenario and we'll show you the best nearby alternatives that still fit your
              trip style and budget. V1 uses smart sample data — live location updates coming soon.
            </Text>
            <View style={styles.tipBadge}>
              <Text style={styles.tipBadgeText}>Sample data · Live provider integration ready</Text>
            </View>
          </LinearGradient>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { paddingBottom: 130 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },

  hero: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl + 8,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  heroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#14B8A6',
    opacity: 0.14,
    top: -80,
    right: -60,
  },
  boltWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  boltPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2DD4BF',
  },
  boltBubble: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(45,212,191,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 30 },
  heroTitle: { ...Typography.displayMd, color: '#FFFFFF', lineHeight: 38 },
  heroSub: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.65)',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },

  scenarioHeadline: {
    ...Typography.h2,
    color: Colors.text,
    paddingHorizontal: Spacing.screenH,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  scenarioSub: {
    ...Typography.body,
    color: Colors.muted,
    paddingHorizontal: Spacing.screenH,
    marginBottom: Spacing.base,
  },
  grid: {
    paddingHorizontal: Spacing.screenH,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: { width: '47.5%' },
  scenarioCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 20,
    padding: Spacing.cardPad,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  scenarioIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  scenarioEmoji: { fontSize: 24 },
  scenarioLabel: { ...Typography.h4, color: Colors.text, fontWeight: '700' },
  scenarioDesc: { ...Typography.caption, color: Colors.muted },

  tipCard: {
    marginHorizontal: Spacing.screenH,
    borderRadius: 22,
    padding: Spacing.cardPadLg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  tipTitle: { ...Typography.h4, color: '#FFFFFF', fontWeight: '700' },
  tipText: { ...Typography.bodySm, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  tipBadge: {
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tipBadgeText: { ...Typography.caption, color: Colors.tealLight, fontWeight: '600', fontSize: 10.5 },
});
