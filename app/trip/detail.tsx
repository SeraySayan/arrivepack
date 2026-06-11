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
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import StatusPill from '../../src/components/ui/StatusPill';
import TrustBadge from '../../src/components/ui/TrustBadge';
import AppButton from '../../src/components/ui/AppButton';
import AppToast from '../../src/components/ui/AppToast';
import ExternalLinkCard from '../../src/components/ui/ExternalLinkCard';
import { PREPARATION_CHECKLIST } from '../../src/data/egypt';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import type { ReadinessStatus, PrepOption, RecommendedCard } from '../../src/types';

/* ─── Recommended card ─────────────────────────────────────── */

function RecommendedSection({ card }: { card: RecommendedCard }) {
  return (
    <View style={recStyles.card}>
      <View style={recStyles.header}>
        <View style={recStyles.iconBubble}>
          <Text style={recStyles.icon}>✓</Text>
        </View>
        <Text style={recStyles.title}>Recommended for your trip</Text>
      </View>

      <Text style={recStyles.description}>{card.description}</Text>

      <View style={recStyles.divider} />

      {card.steps.map((step, i) => (
        <View key={i} style={recStyles.stepRow}>
          <View style={recStyles.stepNum}>
            <Text style={recStyles.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={recStyles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

const recStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    padding: Spacing.cardPad,
    borderWidth: 1.5,
    borderColor: Colors.teal + '30',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, letterSpacing: -0.2 },
  description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  divider: { height: 1, backgroundColor: Colors.border },
  stepRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { fontSize: 11, fontWeight: '700', color: Colors.tealDark },
  stepText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 22 },
});

/* ─── Compact option card ───────────────────────────────────── */

function OptionCard({ opt }: { opt: PrepOption }) {
  return (
    <View style={optStyles.card}>
      {/* Title row */}
      <View style={optStyles.titleRow}>
        <Text style={optStyles.title}>{opt.title}</Text>
        {opt.link?.sourceType === 'official_recommended' && (
          <View style={optStyles.officialBadge}>
            <Text style={optStyles.officialBadgeText}>Official</Text>
          </View>
        )}
      </View>

      {/* Best for */}
      <Text style={optStyles.bestFor}>Best for: {opt.bestFor}</Text>

      {/* Cost */}
      {opt.estimatedCost && (
        <View style={optStyles.costRow}>
          <Text style={optStyles.costLabel}>Est. cost</Text>
          <Text style={optStyles.costValue}>{opt.estimatedCost}</Text>
        </View>
      )}

      {/* Pros */}
      <View style={optStyles.prosBlock}>
        {opt.pros.map((p, i) => (
          <View key={i} style={optStyles.proRow}>
            <Text style={optStyles.proCheck}>✓</Text>
            <Text style={optStyles.proText}>{p}</Text>
          </View>
        ))}
      </View>

      {/* Watch-out */}
      {opt.watchOut && (
        <View style={optStyles.watchCard}>
          <Text style={optStyles.watchIcon}>⚠</Text>
          <Text style={optStyles.watchText}>{opt.watchOut}</Text>
        </View>
      )}

      {/* Link */}
      {opt.link && <ExternalLinkCard link={opt.link} />}
    </View>
  );
}

const optStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  officialBadge: {
    backgroundColor: Colors.teal + '18',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  officialBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.tealDark },
  bestFor: { ...Typography.caption, color: Colors.teal, fontWeight: '600', lineHeight: 18 },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radii.sm,
  },
  costLabel: { ...Typography.caption, color: Colors.muted },
  costValue: { ...Typography.caption, color: Colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  prosBlock: { gap: 5 },
  proRow: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  proCheck: { fontSize: 12, color: Colors.success, marginTop: 2, flexShrink: 0 },
  proText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  watchCard: {
    flexDirection: 'row',
    gap: 7,
    backgroundColor: Colors.yellowLight,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  watchIcon: { fontSize: 12, color: Colors.warning, marginTop: 2, flexShrink: 0 },
  watchText: { ...Typography.caption, color: '#92400E', flex: 1, lineHeight: 18 },
});

/* ─── Main screen ───────────────────────────────────────────── */

export default function DetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { trip, updateReadinessItem } = useTripStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const checklistItem = PREPARATION_CHECKLIST.find((c) => c.id === itemId);
  const readinessItem = trip?.readiness.items.find((i) => i.id === itemId);
  const status = readinessItem?.status ?? checklistItem?.status ?? 'not_set';
  const isReady = status === 'ready';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  if (!checklistItem) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.notFound}>Item not found.</Text>
      </SafeAreaView>
    );
  }

  const handleToggleReady = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newStatus: ReadinessStatus = isReady ? 'needs_review' : 'ready';
    updateReadinessItem(itemId!, newStatus);
    showToast(isReady ? 'Status updated' : `${checklistItem.title} marked as ready ✅`);
  };

  const { details } = checklistItem;
  const hasOptions = details.options && details.options.length > 0;
  const hasLinks = details.sourceLinks && details.sourceLinks.length > 0;
  const visibleBullets = details.whatYouNeedToKnow.slice(0, 4);
  const optionsSectionTitle = details.optionsSectionTitle ?? 'Your options';
  const ctaHelper = details.ctaHelper ?? 'Mark as ready to update your trip readiness score.';
  const ctaLabel = details.ctaLabel ?? 'Mark as ready';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* ── 1. Hero card ── */}
        <LinearGradient
          colors={['#0F172A', '#0F2E2B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerGlow} />
          <Text style={styles.headerIcon}>{checklistItem.icon}</Text>
          <Text style={styles.headerTitle}>{checklistItem.title}</Text>
          <Text style={styles.headerSummary}>{details.summary}</Text>
          <View style={styles.headerBadges}>
            <StatusPill status={status} />
            <TrustBadge trust={checklistItem.trust} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Recommended for you (data-driven) ── */}
        {details.recommendedCard && (
          <RecommendedSection card={details.recommendedCard} />
        )}

        {/* ── 3. What you need to know (max 4 bullets) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What you need to know</Text>
          <View style={styles.bulletCard}>
            {visibleBullets.map((point, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 4. Options ── */}
        {hasOptions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{optionsSectionTitle}</Text>
            <View style={styles.optionsList}>
              {details.options!.map((opt) => (
                <OptionCard key={opt.id} opt={opt} />
              ))}
            </View>
          </View>
        )}

        {/* ── 5. Useful official links (before checklist) ── */}
        {hasLinks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Useful official links</Text>
            <Text style={styles.linksNote}>
              Always verify before use. Placeholder links are marked "Coming soon".
            </Text>
            <View style={styles.linksList}>
              {details.sourceLinks.map((link) => (
                <ExternalLinkCard key={link.id} link={link} />
              ))}
            </View>
          </View>
        )}

        {/* ── 6. Before you go checklist ── */}
        {details.beforeYouGo.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Before you go</Text>
            <View style={styles.checklistCard}>
              {details.beforeYouGo.map((item, i) => (
                <View key={i} style={styles.checkRow}>
                  <View style={styles.checkBox}>
                    <Text style={styles.checkMark}>○</Text>
                  </View>
                  <Text style={styles.checkText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Warning ── */}
        {details.warning && (
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>{details.warning}</Text>
          </View>
        )}

        {/* ── 7. Mark as ready CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isReady
              ? 'This item is marked ready and contributes to your readiness score.'
              : ctaHelper}
          </Text>
          <AppButton
            label={isReady ? `✓ ${ctaLabel} — tap to undo` : ctaLabel}
            onPress={handleToggleReady}
            variant={isReady ? 'secondary' : 'primary'}
            fullWidth
          />
        </View>

      </ScrollView>

      <AppToast message={toastMsg} visible={toastVisible} emoji={isReady ? '↩️' : '✅'} />
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FA' },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 110,
    paddingTop: Spacing.base,
    gap: Spacing.lg,
  },
  backBtn: { paddingVertical: Spacing.xs },
  backText: { ...Typography.body, color: Colors.teal, fontWeight: '600' },
  notFound: { ...Typography.body, color: Colors.muted, textAlign: 'center', marginTop: 40 },

  /* Hero card */
  headerCard: {
    borderRadius: Radii.cardLg,
    padding: Spacing.xl,
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#14B8A6',
    opacity: 0.12,
    top: -50,
    right: -40,
  },
  headerIcon: { fontSize: 36, marginBottom: 4 },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSummary: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 22,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
    flexWrap: 'wrap',
  },

  /* Sections */
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  /* What you need to know */
  bulletCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.teal,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 22 },

  /* Options */
  optionsList: { gap: Spacing.sm },

  /* Links */
  linksNote: { ...Typography.caption, color: Colors.mutedLight },
  linksList: { gap: Spacing.sm },

  /* Before you go checklist */
  checklistCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  checkRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkMark: { fontSize: 10, color: Colors.mutedLight },
  checkText: { ...Typography.body, color: Colors.textSecondary, flex: 1, lineHeight: 22 },

  /* Warning */
  warningCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.yellowLight,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.yellow + '50',
    alignItems: 'flex-start',
  },
  warningIcon: { fontSize: 18, flexShrink: 0 },
  warningText: { ...Typography.body, color: '#92400E', flex: 1, lineHeight: 22 },

  /* CTA section */
  ctaSection: { gap: Spacing.sm },
  ctaHelper: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
