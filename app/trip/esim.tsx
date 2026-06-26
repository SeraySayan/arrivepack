import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  Linking,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink, ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import AppButton from '../../src/components/ui/AppButton';
import AppToast from '../../src/components/ui/AppToast';
import TrustBadge from '../../src/components/ui/TrustBadge';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animateLayout = () => {
  if (Platform.OS !== 'web') {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }
};

/* ─── Static config ────────────────────────────────────────── */

const TRUST_META = {
  sourceType: 'provider_ready' as const,
  confidence: 'high' as const,
  lastCheckedLabel: 'Sample data · Jun 2025',
};

const USAGE_PROFILES = [
  {
    label: 'Light',
    range: '3–5 GB',
    desc: 'Messaging & maps',
    emoji: '💬',
    recommended: false,
  },
  {
    label: 'Normal',
    range: '5–10 GB',
    desc: 'Maps, social & calls',
    emoji: '📱',
    recommended: true,
  },
  {
    label: 'Heavy',
    range: '10 GB+',
    desc: 'Streaming & creating',
    emoji: '🎬',
    recommended: false,
  },
];

interface ComparisonOption {
  id: string;
  iconEmoji: string;
  iconBg: string;
  title: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  best: string;
  pros: string[];
  watchOuts: string[];
}

const COMPARISON: ComparisonOption[] = [
  {
    id: 'esim',
    iconEmoji: '📲',
    iconBg: '#EFF6FF',
    title: 'eSIM before travel',
    badge: 'Easiest',
    badgeBg: '#E6FFFA',
    badgeColor: '#0F766E',
    best: 'Landing with internet already working.',
    pros: ['Buy before you fly', 'Instant activation', 'Keeps your number'],
    watchOuts: ['Needs an eSIM-compatible device', 'Check current plans online'],
  },
  {
    id: 'local_sim',
    iconEmoji: '🛬',
    iconBg: '#FFFBEB',
    title: 'Local SIM on arrival',
    badge: 'Good backup',
    badgeBg: '#FFFBEB',
    badgeColor: '#B45309',
    best: 'Cheaper local data after you land.',
    pros: ['Often cheaper per GB', 'Sold at airport shops', 'Good for longer trips'],
    watchOuts: ['Takes time at arrival', 'May need passport registration'],
  },
  {
    id: 'wifi',
    iconEmoji: '📶',
    iconBg: '#F1F5F9',
    title: 'Wi-Fi backup',
    badge: 'Backup only',
    badgeBg: '#F1F5F9',
    badgeColor: '#64748B',
    best: 'Hotels, cafés & airports as secondary use.',
    pros: ['Handy at hotels & cafés', 'No setup cost'],
    watchOuts: ['Not reliable alone', 'Not for maps or emergencies'],
  },
];

const COMM_TIPS = [
  'Save your hotel address offline before departure.',
  'Keep WhatsApp ready — drivers, hosts & local contacts use it.',
  'Download offline maps before you fly.',
  'Keep emergency contacts saved offline.',
];

interface ProviderLink {
  id: string;
  name: string;
  description: string;
  url: string;
  ctaLabel: string;
}

const ESIM_PROVIDERS: ProviderLink[] = [
  {
    id: 'airalo',
    name: 'Airalo',
    description: 'Check current Egypt eSIM plans and prices on Airalo before you travel.',
    url: 'https://www.airalo.com',
    ctaLabel: 'Open Airalo',
  },
  {
    id: 'nomad',
    name: 'Nomad',
    description: 'Check current Egypt eSIM plans and prices on Nomad before you travel.',
    url: 'https://www.getnomad.app',
    ctaLabel: 'Open Nomad',
  },
];

/* ─── ProviderLinkCard ─────────────────────────────────────── */

function ProviderLinkCard({ provider }: { provider: ProviderLink }) {
  const handleOpen = async () => {
    Haptics.selectionAsync();
    try {
      const canOpen = await Linking.canOpenURL(provider.url);
      if (canOpen) {
        await Linking.openURL(provider.url);
      } else {
        Alert.alert('Cannot open link', 'This link could not be opened on your device.');
      }
    } catch {
      Alert.alert('Error', 'Unable to open this link.');
    }
  };

  return (
    <Pressable
      onPress={handleOpen}
      style={({ pressed }) => [provStyles.card, pressed && provStyles.pressed]}
    >
      <View style={provStyles.logoBubble}>
        <Text style={provStyles.logoText}>{provider.name.charAt(0)}</Text>
      </View>
      <View style={provStyles.left}>
        <Text style={provStyles.name}>{provider.name}</Text>
        <View style={provStyles.badges}>
          <View style={provStyles.badge}>
            <Text style={provStyles.badgeText}>External</Text>
          </View>
          <View style={[provStyles.badge, provStyles.badgeWarn]}>
            <Text style={[provStyles.badgeText, provStyles.badgeWarnText]}>Confirm pricing</Text>
          </View>
        </View>
      </View>
      <View style={provStyles.ctaBtn}>
        <ExternalLink size={13} color={Colors.teal} />
        <Text style={provStyles.ctaBtnText}>Open</Text>
      </View>
    </Pressable>
  );
}

const provStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    padding: Spacing.cardPad,
    borderWidth: 1.5,
    borderColor: Colors.teal + '2B',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  logoBubble: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: { fontSize: 19, fontWeight: '800', color: Colors.tealDark },
  left: { flex: 1, gap: 5 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  badge: {
    backgroundColor: Colors.skyBlueLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10, fontWeight: '600', color: Colors.skyBlue },
  badgeWarn: { backgroundColor: Colors.yellowLight },
  badgeWarnText: { color: Colors.warning },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.mint,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.teal + '40',
    flexShrink: 0,
  },
  ctaBtnText: { fontSize: 12, fontWeight: '700', color: Colors.tealDark },
});

/* ─── ComparisonCard — expandable ──────────────────────────── */

function ComparisonCard({
  item,
  expanded,
  onToggle,
}: {
  item: ComparisonOption;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={cmpStyles.card}>
      <Pressable onPress={onToggle} style={cmpStyles.header}>
        <View style={[cmpStyles.iconBubble, { backgroundColor: item.iconBg }]}>
          <Text style={cmpStyles.iconEmoji}>{item.iconEmoji}</Text>
        </View>
        <View style={cmpStyles.headerText}>
          <View style={cmpStyles.titleRow}>
            <Text style={cmpStyles.title}>{item.title}</Text>
            <View style={[cmpStyles.badge, { backgroundColor: item.badgeBg }]}>
              <Text style={[cmpStyles.badgeText, { color: item.badgeColor }]}>{item.badge}</Text>
            </View>
          </View>
          <Text style={cmpStyles.best} numberOfLines={expanded ? undefined : 1}>{item.best}</Text>
        </View>
        <View style={[cmpStyles.chevronWrap, expanded && cmpStyles.chevronWrapOpen]}>
          <ChevronDown
            size={18}
            color={expanded ? Colors.teal : Colors.mutedLight}
            strokeWidth={2.4}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={cmpStyles.detail}>
          <View style={cmpStyles.chipRow}>
            {item.pros.map((p, i) => (
              <View key={i} style={cmpStyles.proChip}>
                <Text style={cmpStyles.proCheck}>✓</Text>
                <Text style={cmpStyles.proText}>{p}</Text>
              </View>
            ))}
          </View>
          <View style={cmpStyles.chipRow}>
            {item.watchOuts.map((w, i) => (
              <View key={i} style={cmpStyles.watchChip}>
                <Text style={cmpStyles.watchIcon}>⚠</Text>
                <Text style={cmpStyles.watchText}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const cmpStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 22 },
  headerText: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  best: { ...Typography.caption, color: Colors.muted, lineHeight: 17 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    flexShrink: 0,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
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
  detail: { gap: 7, paddingTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  proChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  proCheck: { fontSize: 11, color: Colors.success, fontWeight: '800' },
  proText: { ...Typography.caption, color: Colors.tealDark, fontWeight: '600' },
  watchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.yellowLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  watchIcon: { fontSize: 11, color: Colors.warning },
  watchText: { ...Typography.caption, color: '#92400E', fontWeight: '600' },
});

/* ─── Main screen ───────────────────────────────────────────── */

export default function EsimScreen() {
  const { trip, updateReadinessItem } = useTripStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [expandedCmp, setExpandedCmp] = useState<string | null>('esim');
  const durationDays = trip?.durationDays ?? 7;

  const isPlanned =
    trip?.readiness.items.find((i) => i.id === 'connectivity')?.status === 'ready';

  const handleMarkPlanned = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateReadinessItem('connectivity', isPlanned ? 'needs_review' : 'ready');
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const toggleCmp = (id: string) => {
    Haptics.selectionAsync();
    animateLayout();
    setExpandedCmp((cur) => (cur === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Cinematic ambient background */}
      <LinearGradient
        colors={['#EAF1F6', '#F1F4F8', '#F8FAFC']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.ambientBg}
        pointerEvents="none"
      />
      <View style={styles.ambientBlob} pointerEvents="none" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* ── 1. Header ── */}
        <LinearGradient
          colors={['#0B1220', '#0B2D40', '#0C3742']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlow} />
          <View style={styles.heroGlowWarm} />
          <Text style={styles.heroEyebrow}>STAY CONNECTED</Text>
          <Text style={styles.heroTitle}>Phone & Internet</Text>
          <Text style={styles.heroSubtitle}>
            eSIM, local SIM, WhatsApp & Wi-Fi — sorted before you land.
          </Text>
          <View style={styles.heroChips}>
            {['eSIM', 'Local SIM', 'Wi-Fi'].map((c) => (
              <View key={c} style={styles.heroChip}>
                <Text style={styles.heroChipText}>{c}</Text>
              </View>
            ))}
          </View>
          <View style={styles.heroTrust}>
            <TrustBadge trust={TRUST_META} compact />
          </View>
        </LinearGradient>

        {/* ── 2. Best way to stay connected ── */}
        <View style={styles.recommendCard}>
          <View style={styles.recommendGlow} pointerEvents="none" />
          <View style={styles.recommendHeader}>
            <View style={styles.recommendIcon}>
              <Text style={styles.recommendIconText}>✓</Text>
            </View>
            <Text style={styles.recommendTitle}>Best way to stay connected</Text>
          </View>
          <View style={styles.recommendDivider} />
          {[
            { icon: '📲', label: 'eSIM', note: 'easiest before you land', tone: Colors.teal },
            { icon: '🛬', label: 'Local SIM', note: 'cheaper, takes time at arrival', tone: Colors.warning },
            { icon: '📶', label: 'Wi-Fi', note: 'useful backup, not your only plan', tone: Colors.muted },
            { icon: '💬', label: 'WhatsApp', note: 'hosts, drivers & local contacts', tone: Colors.success },
          ].map((item, i) => (
            <View key={i} style={styles.recommendRow}>
              <View style={styles.recommendRowIconWrap}>
                <Text style={styles.recommendRowIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.recommendRowLabel}>{item.label}</Text>
              <Text style={styles.recommendRowNote} numberOfLines={1}>{item.note}</Text>
              <View style={[styles.recommendDot, { backgroundColor: item.tone }]} />
            </View>
          ))}
        </View>

        {/* ── 3. How much data? ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>How much data do you need?</Text>
          </View>
          <Text style={styles.sectionSub}>Based on a {durationDays}-day Egypt trip.</Text>
          <View style={styles.usageGrid}>
            {USAGE_PROFILES.map((p) => (
              <View key={p.label} style={[styles.usageCard, p.recommended && styles.usageCardRec]}>
                {p.recommended && (
                  <View style={styles.recBadge}>
                    <Text style={styles.recText}>PICK</Text>
                  </View>
                )}
                <Text style={styles.usageEmoji}>{p.emoji}</Text>
                <Text style={styles.usageLabel}>{p.label}</Text>
                <Text style={styles.usageRange}>{p.range}</Text>
                <Text style={styles.usageDesc}>{p.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 4. eSIM, local SIM, or Wi-Fi? (expandable) ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>eSIM, local SIM, or Wi-Fi?</Text>
            <Text style={styles.sectionHint}>Tap to expand</Text>
          </View>
          <View style={styles.comparisonStack}>
            {COMPARISON.map((item) => (
              <ComparisonCard
                key={item.id}
                item={item}
                expanded={expandedCmp === item.id}
                onToggle={() => toggleCmp(item.id)}
              />
            ))}
          </View>
        </View>

        {/* ── 5. Communication tips ── */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsEmoji}>💡</Text>
            <Text style={styles.tipsTitle}>Smart tips</Text>
          </View>
          {COMM_TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* ── 6. Provider options ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Provider options</Text>
          </View>
          <Text style={styles.sectionSub}>
            External planning links — always confirm current Egypt plans & prices.
          </Text>

          {/* eSIM providers */}
          <View style={styles.providerGroup}>
            <Text style={styles.providerGroupLabel}>eSIM before travel</Text>
            <View style={styles.providerList}>
              {ESIM_PROVIDERS.map((p) => (
                <ProviderLinkCard key={p.id} provider={p} />
              ))}
            </View>
          </View>

          {/* Local SIM */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIconBubble}>
                <Text style={styles.infoIcon}>🛬</Text>
              </View>
              <Text style={styles.infoTitle}>Local SIM at Cairo Airport</Text>
            </View>
            <View style={styles.infoChipRow}>
              {[
                'Vodafone · Orange · Etisalat',
                'Bring passport',
                'Carry small cash',
              ].map((item, i) => (
                <View key={i} style={styles.infoChip}>
                  <Text style={styles.infoChipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Wi-Fi backup */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIconBubble}>
                <Text style={styles.infoIcon}>📶</Text>
              </View>
              <Text style={styles.infoTitle}>Wi-Fi backup</Text>
            </View>
            <View style={styles.infoChipRow}>
              {[
                'Hotels · cafés · airports',
                'Download offline maps',
                'Keep data for emergencies',
              ].map((item, i) => (
                <View key={i} style={styles.infoChip}>
                  <Text style={styles.infoChipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── 7. CTA ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHelper}>
            {isPlanned
              ? 'Phone & Internet is marked as planned and contributes to your readiness score.'
              : 'Mark this ready after choosing your main connection plan for Egypt.'}
          </Text>
          <AppButton
            label={isPlanned ? '✓ Planned — tap to undo' : 'I planned phone & internet'}
            onPress={handleMarkPlanned}
            variant={isPlanned ? 'secondary' : 'primary'}
            fullWidth
          />
        </View>

      </ScrollView>

      <AppToast
        message={isPlanned ? 'Status updated' : 'Phone & Internet planned ✅'}
        visible={toastVisible}
        emoji="📱"
      />
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  ambientBg: { ...StyleSheet.absoluteFillObject },
  ambientBlob: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 110,
    paddingTop: Spacing.base,
    gap: Spacing.lg,
  },

  back: { paddingVertical: Spacing.xs },
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
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#3B82F6',
    opacity: 0.12,
    top: -50,
    right: -35,
  },
  heroGlowWarm: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#14B8A6',
    opacity: 0.08,
    bottom: -50,
    left: -30,
  },
  heroEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(96,165,250,0.95)',
    letterSpacing: 1.6,
    marginBottom: 2,
  },
  heroTitle: { fontSize: 25, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  heroSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.68)', lineHeight: 21 },
  heroChips: { flexDirection: 'row', gap: 7, marginTop: 10, flexWrap: 'wrap' },
  heroChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroChipText: { fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  heroTrust: { marginTop: 10 },

  /* Recommend card */
  recommendCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    padding: Spacing.cardPad,
    borderWidth: 1.5,
    borderColor: Colors.teal + '33',
    gap: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.md,
  },
  recommendGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(20,184,166,0.07)',
  },
  recommendHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  recommendIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.teal,
  },
  recommendIconText: { fontSize: 15, color: '#FFFFFF', fontWeight: '800' },
  recommendTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1, letterSpacing: -0.2 },
  recommendDivider: { height: 1, backgroundColor: Colors.borderLight },
  recommendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recommendRowIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recommendRowIcon: { fontSize: 15 },
  recommendRowLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, flexShrink: 0, width: 72 },
  recommendRowNote: { ...Typography.caption, color: Colors.muted, flex: 1, lineHeight: 18 },
  recommendDot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },

  /* Sections */
  section: { gap: Spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionAccent: { width: 4, height: 16, borderRadius: 2, backgroundColor: Colors.teal },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  sectionHint: { ...Typography.caption, color: Colors.mutedLight, marginLeft: 'auto', fontWeight: '500' },
  sectionSub: { ...Typography.caption, color: Colors.muted, marginTop: -2 },

  /* Usage grid */
  usageGrid: { flexDirection: 'row', gap: Spacing.sm },
  usageCard: {
    flex: 1,
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  usageCardRec: {
    borderColor: Colors.teal,
    backgroundColor: Colors.mint,
  },
  usageEmoji: { fontSize: 22 },
  usageLabel: { ...Typography.captionBold, color: Colors.text, marginTop: 2 },
  usageRange: { fontSize: 16, fontWeight: '800', color: Colors.teal, letterSpacing: -0.3 },
  usageDesc: { ...Typography.caption, color: Colors.muted, textAlign: 'center', lineHeight: 15, fontSize: 11 },
  recBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.teal,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  recText: { fontSize: 8.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4 },

  /* Comparison — stacked vertical */
  comparisonStack: { gap: Spacing.md },

  /* Tips card */
  tipsCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.cardLg,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipsEmoji: { fontSize: 17 },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  tipRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.teal,
    marginTop: 7,
    flexShrink: 0,
  },
  tipText: { ...Typography.bodySm, color: Colors.textSecondary, flex: 1, lineHeight: 20 },

  /* Provider group */
  providerGroup: { gap: Spacing.xs },
  providerGroupLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  providerList: { gap: Spacing.sm, marginTop: 4 },

  /* Info cards (local SIM, Wi-Fi) */
  infoCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { fontSize: 17 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  infoChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoChip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  infoChipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },

  /* CTA */
  ctaSection: { gap: Spacing.sm },
  ctaHelper: { ...Typography.caption, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
});
