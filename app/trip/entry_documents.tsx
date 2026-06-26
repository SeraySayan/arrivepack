import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import StatusPill from '../../src/components/ui/StatusPill';
import TrustBadge from '../../src/components/ui/TrustBadge';
import AppButton from '../../src/components/ui/AppButton';
import AppToast from '../../src/components/ui/AppToast';
import ExternalLinkCard from '../../src/components/ui/ExternalLinkCard';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import type { ReadinessStatus } from '../../src/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animateLayout = () => {
  if (Platform.OS !== 'web') {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }
};

const ITEM_ID = 'entry_documents';

const TRUST_META = {
  sourceType: 'official_recommended' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'Sample data · Jun 2025',
};

/* ─── Data ───────────────────────────────────────────────────── */

const SETUP_STEPS = [
  { icon: '🛂', title: 'Passport', note: 'Valid 6+ months beyond return' },
  { icon: '🪪', title: 'Visa', note: 'Confirm from an official source' },
  { icon: '📄', title: 'Copies', note: 'Save digital documents' },
];

const KEY_THINGS = [
  { icon: '🌍', text: 'Visa & passport rules vary by nationality.' },
  { icon: '🛂', text: 'Many travellers qualify for visa on arrival or e-Visa.' },
  { icon: '📄', text: 'Keep passport, stay proof & onward travel ready.' },
  { icon: '✅', text: 'Always confirm with official sources.' },
];

const ENTRY_OPTIONS = [
  {
    id: 'visa_on_arrival',
    icon: '✈️',
    title: 'Visa on arrival',
    bestFor: 'Eligible travellers who want a simple arrival',
    cost: '~$25 USD · sample',
    recommended: false,
    pros: ['No advance paperwork', 'Available at Cairo Airport'],
    watchOut: 'Confirm your eligibility before travelling.',
    link: {
      id: 'egypt-visa-onArrival',
      title: 'Egypt visa on arrival info',
      description: 'General visa-on-arrival eligibility and process.',
      url: 'https://www.egyptair.com',
      sourceType: 'sample_data' as const,
      confidence: 'medium' as const,
      isExternal: true,
      isPlaceholder: true,
    },
  },
  {
    id: 'evisa',
    icon: '💻',
    title: 'Egypt e-Visa',
    bestFor: 'Confirming your visa before you fly',
    cost: '~$25 USD + processing · sample',
    recommended: true,
    pros: ['Skip airport queues', 'Confirmed before departure'],
    watchOut: 'Apply early via the official portal.',
    link: {
      id: 'egypt-evisa',
      title: 'Egypt e-Visa portal',
      description: 'Official Egyptian government e-Visa application portal.',
      url: 'https://visa2egypt.gov.eg',
      sourceType: 'official_recommended' as const,
      confidence: 'medium' as const,
      isExternal: true,
      isPlaceholder: false,
    },
  },
  {
    id: 'embassy_visa',
    icon: '🏛️',
    title: 'Embassy / advance visa',
    bestFor: 'Nationalities not eligible for VOA or e-Visa',
    cost: 'Varies by nationality',
    recommended: false,
    pros: ['Arranged ahead of time', 'Accepted for all eligible'],
    watchOut: 'Contact your embassy early — lead times vary.',
    link: {
      id: 'egypt-embassy',
      title: 'Egyptian embassy directory',
      description: 'Find the Egyptian embassy or consulate in your country.',
      url: 'https://www.mfa.gov.eg',
      sourceType: 'official_recommended' as const,
      confidence: 'medium' as const,
      isExternal: true,
      isPlaceholder: true,
    },
  },
];

const SOURCE_LINKS = [
  {
    id: 'egypt-evisa-official',
    title: 'Egypt e-Visa official portal',
    description: 'Apply for an Egyptian e-Visa online before your trip.',
    url: 'https://visa2egypt.gov.eg',
    sourceType: 'official_recommended' as const,
    confidence: 'medium' as const,
    isExternal: true,
    isPlaceholder: false,
  },
  {
    id: 'egypt-mfa',
    title: 'Egyptian Ministry of Foreign Affairs',
    description: 'Official embassy directory and entry requirements by nationality.',
    url: 'https://www.mfa.gov.eg',
    sourceType: 'official_recommended' as const,
    confidence: 'medium' as const,
    isExternal: true,
    isPlaceholder: true,
  },
  {
    id: 'iata-travel',
    title: 'IATA Travel Centre',
    description: 'Check passport and visa requirements by nationality.',
    url: 'https://www.iata.org/en/services/travel/travel-centre',
    sourceType: 'official_recommended' as const,
    confidence: 'high' as const,
    isExternal: true,
    isPlaceholder: false,
  },
];

const BEFORE_YOU_GO = [
  'Visa requirement checked',
  'Passport valid 6+ months',
  'Document copies saved',
  'Onward travel & contacts ready',
  'Travel insurance considered',
];

/* ─── Reusable presentational components ─────────────────────── */

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

type EntryOption = (typeof ENTRY_OPTIONS)[number];

function EntryOptionCard({
  opt,
  expanded,
  onToggle,
}: {
  opt: EntryOption;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.optionCard, opt.recommended && styles.optionCardRec]}>
      {opt.recommended && (
        <View style={styles.recRibbon}>
          <Text style={styles.recRibbonText}>RECOMMENDED</Text>
        </View>
      )}

      <Pressable onPress={onToggle} style={styles.optionTop}>
        <View style={styles.optionIconBubble}>
          <Text style={styles.optionIcon}>{opt.icon}</Text>
        </View>
        <View style={styles.optionHeaderText}>
          <Text style={styles.optionTitle}>{opt.title}</Text>
          <Text style={styles.optionBestFor} numberOfLines={2}>{opt.bestFor}</Text>
        </View>
        <View style={[styles.chevronWrap, expanded && styles.chevronWrapOpen]}>
          <ChevronDown
            size={18}
            color={expanded ? Colors.teal : Colors.mutedLight}
            strokeWidth={2.4}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        </View>
      </Pressable>

      <Pressable onPress={onToggle} style={styles.costChip}>
        <Text style={styles.costChipIcon}>💳</Text>
        <Text style={styles.costChipValue}>{opt.cost}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.optionDetail}>
          <View style={styles.proChipRow}>
            {opt.pros.map((p, i) => (
              <View key={i} style={styles.proChip}>
                <Text style={styles.proChipCheck}>✓</Text>
                <Text style={styles.proChipText}>{p}</Text>
              </View>
            ))}
          </View>
          <View style={styles.watchCard}>
            <Text style={styles.watchIcon}>⚠</Text>
            <Text style={styles.watchText}>{opt.watchOut}</Text>
          </View>
          <ExternalLinkCard link={opt.link} />
        </View>
      )}
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────── */

export default function EntryDocumentsScreen() {
  const { trip, updateReadinessItem } = useTripStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('evisa');

  const readinessItem = trip?.readiness.items.find((i) => i.id === ITEM_ID);
  const status: ReadinessStatus = readinessItem?.status ?? 'needs_review';
  const isReady = status === 'ready';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handleToggleReady = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const next: ReadinessStatus = isReady ? 'needs_review' : 'ready';
    updateReadinessItem(ITEM_ID, next);
    showToast(isReady ? 'Status updated' : 'Entry & Documents marked as ready ✅');
  };

  const toggleOption = (id: string) => {
    Haptics.selectionAsync();
    animateLayout();
    setExpandedId((cur) => (cur === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Cinematic ambient background */}
      <LinearGradient
        colors={['#EAF3F2', '#F1F5F8', '#F8FAFC']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.ambientBg}
        pointerEvents="none"
      />
      <View style={styles.ambientBlob} pointerEvents="none" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* ── 1. Hero ── */}
        <LinearGradient
          colors={['#0B1220', '#0F2E2B', '#0C3742']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlow} />
          <View style={styles.heroGlowWarm} />
          <Text style={styles.heroEyebrow}>ENTRY REQUIREMENTS</Text>
          <Text style={styles.heroTitle}>Entry & Documents</Text>
          <Text style={styles.heroSub}>
            What you need to enter Egypt — at a glance.
          </Text>
          <View style={styles.heroBadges}>
            <StatusPill status={status} />
            <TrustBadge trust={TRUST_META} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Best path — visual stepper ── */}
        <View style={styles.section}>
          <SectionHeader title="Best path for most travellers" />
          <View style={styles.stepperCard}>
            <View style={styles.stepperGlow} pointerEvents="none" />
            <View style={styles.stepperRow}>
              {SETUP_STEPS.map((step, i) => (
                <React.Fragment key={i}>
                  <View style={styles.stepItem}>
                    <View style={styles.stepBubble}>
                      <Text style={styles.stepEmoji}>{step.icon}</Text>
                      <View style={styles.stepNumBadge}>
                        <Text style={styles.stepNumText}>{i + 1}</Text>
                      </View>
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepNote}>{step.note}</Text>
                  </View>
                  {i < SETUP_STEPS.length - 1 && <View style={styles.stepConnector} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        {/* ── 3. Entry options (expandable) ── */}
        <View style={styles.section}>
          <SectionHeader title="Entry options" hint="Tap to expand" />
          <View style={styles.optionsList}>
            {ENTRY_OPTIONS.map((opt) => (
              <EntryOptionCard
                key={opt.id}
                opt={opt}
                expanded={expandedId === opt.id}
                onToggle={() => toggleOption(opt.id)}
              />
            ))}
          </View>
        </View>

        {/* ── 4. What you need to know — icon tiles ── */}
        <View style={styles.section}>
          <SectionHeader title="What you need to know" />
          <View style={styles.factGrid}>
            {KEY_THINGS.map((fact, i) => (
              <View key={i} style={styles.factTile}>
                <View style={styles.factIconCircle}>
                  <Text style={styles.factIcon}>{fact.icon}</Text>
                </View>
                <Text style={styles.factText}>{fact.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 5. Official sources ── */}
        <View style={styles.section}>
          <SectionHeader title="Official sources" />
          <Text style={styles.linksNote}>
            Always verify your specific rules with official government or embassy sources.
          </Text>
          <View style={styles.linksList}>
            {SOURCE_LINKS.map((link) => (
              <ExternalLinkCard key={link.id} link={link} />
            ))}
          </View>
        </View>

        {/* ── 6. Before you go — check grid ── */}
        <View style={styles.section}>
          <SectionHeader title="Before you go" />
          <View style={styles.checkGrid}>
            {BEFORE_YOU_GO.map((item, i) => (
              <View key={i} style={styles.checkTile}>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkTick}>✓</Text>
                </View>
                <Text style={styles.checkTileText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Warning ── */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Sample data. Always confirm your entry requirements with official government or embassy sources before departure.
          </Text>
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isReady
              ? 'Entry & Documents is marked ready. Tap to undo.'
              : 'Mark ready after you confirm your visa and passport validity.'}
          </Text>
          <AppButton
            label={isReady ? '✓ I checked this — tap to undo' : 'I checked this — mark as ready'}
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
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  ambientBg: { ...StyleSheet.absoluteFillObject },
  ambientBlob: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(20,184,166,0.09)',
  },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 110,
    paddingTop: Spacing.base,
    gap: Spacing.lg,
  },

  backBtn: { paddingVertical: Spacing.xs },
  backText: { ...Typography.body, color: Colors.teal, fontWeight: '600' },

  /* Hero */
  heroCard: {
    borderRadius: Radii.cardLg,
    padding: Spacing.xl,
    gap: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...Shadows.lg,
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#14B8A6',
    opacity: 0.14,
    top: -60,
    right: -45,
  },
  heroGlowWarm: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F59E0B',
    opacity: 0.06,
    bottom: -50,
    left: -30,
  },
  heroEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(45,212,191,0.9)',
    letterSpacing: 1.6,
    marginBottom: 2,
  },
  heroTitle: { fontSize: 25, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  heroSub: { ...Typography.body, color: 'rgba(255,255,255,0.68)', lineHeight: 21 },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 8,
    flexWrap: 'wrap',
  },

  /* Sections */
  section: { gap: Spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionAccent: { width: 4, height: 16, borderRadius: 2, backgroundColor: Colors.teal },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },
  sectionHint: { ...Typography.caption, color: Colors.mutedLight, marginLeft: 'auto', fontWeight: '500' },

  /* Stepper card */
  stepperCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    borderWidth: 1.5,
    borderColor: Colors.teal + '2E',
    padding: Spacing.cardPad,
    overflow: 'hidden',
    ...Shadows.md,
  },
  stepperGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(20,184,166,0.07)',
  },
  stepperRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { flex: 1, alignItems: 'center', gap: 4 },
  stepBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.teal + '33',
    marginBottom: 4,
  },
  stepEmoji: { fontSize: 24 },
  stepNumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.cardWhite,
  },
  stepNumText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  stepTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  stepNote: { ...Typography.caption, color: Colors.muted, textAlign: 'center', lineHeight: 15, fontSize: 11 },
  stepConnector: {
    height: 2,
    flex: 0.5,
    backgroundColor: Colors.borderLight,
    marginTop: 27,
    borderRadius: 1,
  },

  /* Option cards (expandable) */
  optionsList: { gap: Spacing.md },
  optionCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.cardPad,
    gap: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  optionCardRec: {
    borderColor: Colors.teal + '55',
    borderWidth: 1.5,
  },
  recRibbon: {
    position: 'absolute',
    top: 12,
    right: -32,
    backgroundColor: Colors.teal,
    paddingHorizontal: 34,
    paddingVertical: 3,
    transform: [{ rotate: '45deg' }],
  },
  recRibbonText: { fontSize: 8.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.6 },
  optionTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  optionIconBubble: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
  },
  optionIcon: { fontSize: 22 },
  optionHeaderText: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  optionBestFor: { ...Typography.caption, color: Colors.teal, fontWeight: '600', lineHeight: 16 },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chevronWrapOpen: { backgroundColor: Colors.mint },
  costChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  costChipIcon: { fontSize: 12 },
  costChipValue: { ...Typography.caption, color: Colors.text, fontWeight: '700' },
  optionDetail: { gap: Spacing.sm, paddingTop: 2 },
  proChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  proChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  proChipCheck: { fontSize: 11, color: Colors.success, fontWeight: '800' },
  proChipText: { ...Typography.caption, color: Colors.tealDark, fontWeight: '600' },
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

  /* Fact tiles */
  factGrid: { gap: Spacing.sm },
  factTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
    ...Shadows.xs,
  },
  factIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  factIcon: { fontSize: 18 },
  factText: { ...Typography.bodySm, color: Colors.textSecondary, flex: 1, lineHeight: 19, fontWeight: '500' },

  /* Links */
  linksNote: { ...Typography.caption, color: Colors.mutedLight, lineHeight: 17 },
  linksList: { gap: Spacing.sm },

  /* Check grid */
  checkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  checkTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 11,
    paddingHorizontal: 12,
    ...Shadows.xs,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkTick: { fontSize: 11, color: Colors.tealDark, fontWeight: '800' },
  checkTileText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, fontWeight: '500', lineHeight: 16 },

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
  warningIcon: { fontSize: 17, flexShrink: 0 },
  warningText: { ...Typography.bodySm, color: '#92400E', flex: 1, lineHeight: 20 },

  /* CTA */
  ctaSection: { gap: Spacing.sm },
  ctaHelper: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
