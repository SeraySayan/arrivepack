import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Search,
  X,
  ChevronRight,
  Check,
  ShieldCheck,
  Sparkles,
  FileText,
  Send,
  ArrowLeft,
  AlertCircle,
  BookOpen,
} from 'lucide-react-native';
import * as Haptics from '../../src/utils/haptics';
import { DESTINATION_REGISTRY, searchDestinations } from '../../src/data/destinations';
import { usePackRequestStore } from '../../src/store/packRequestStore';
import AppToast from '../../src/components/ui/AppToast';
import {
  createBasicDraft,
  requestDestinationPack,
} from '../../src/services/unsupportedDestinationService';
import type { BasicDraftResult, DestinationRegistryItem } from '../../src/types';

const { height } = Dimensions.get('window');

const ROTATING_PLACEHOLDERS = [
  'Where are you going?',
  'Try Egypt',
  'Try Italy',
  'Try Japan',
  'Try Istanbul',
  'Try Cairo',
];

const QUICK_CHIPS = ['Egypt', 'Italy', 'Japan', 'Istanbul'];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'Verified packs' },
  { icon: Sparkles, label: 'Source-aware' },
  { icon: FileText, label: 'Official sources' },
];

export default function WelcomeScreen() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [comingSoon, setComingSoon] = useState<DestinationRegistryItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; emoji: string } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [draftResult, setDraftResult] = useState<BasicDraftResult | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const requestPack = usePackRequestStore((s) => s.requestPack);

  const results = searchDestinations(query);

  /* ── Entrance animation ── */
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;
  const orbPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulse, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  /* ── Rotating placeholder (only while empty + unfocused) ── */
  useEffect(() => {
    if (query.length > 0) return;
    const timer = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % ROTATING_PLACEHOLDERS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [query]);

  const orbScale = orbPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const orbOpacity = orbPulse.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.16] });

  /* ── Actions ── */
  const showToast = (msg: string, emoji: string) => {
    setToast({ msg, emoji });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2400);
  };

  const startEgyptPack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/onboarding/duration', params: { destinationId: 'egypt' } });
  };

  const handleResultPress = (item: DestinationRegistryItem) => {
    Haptics.selectionAsync();
    if (item.status === 'supported') {
      startEgyptPack();
    } else {
      setComingSoon(item);
    }
  };

  const handleChip = (name: string) => {
    Haptics.selectionAsync();
    setQuery(name);
    setComingSoon(null);
  };

  const handleRequestPack = async () => {
    if (!comingSoon) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await requestDestinationPack(comingSoon.name);
      requestPack(comingSoon.id);
      showToast(`Request saved — we'll prioritize ${comingSoon.name} Pack.`, '📩');
    } catch {
      showToast("Couldn't send request. Please try again.", '⚠️');
    }
  };

  const handleRequestPackFromDraft = async () => {
    const destName = draftResult?.destination ?? comingSoon?.name ?? '';
    if (!destName) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await requestDestinationPack(destName);
      if (comingSoon) requestPack(comingSoon.id);
      showToast(`Request saved — we'll prioritize ${destName} Pack.`, '📩');
    } catch {
      showToast("Couldn't send request. Please try again.", '⚠️');
    }
  };

  const handleBasicDraft = async () => {
    if (!comingSoon) return;
    Haptics.selectionAsync();
    setDraftLoading(true);
    setDraftError(null);
    try {
      const draft = await createBasicDraft(comingSoon.name);
      setDraftResult(draft);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setDraftError(
        "Couldn't create draft right now. You can still request this destination pack."
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setDraftLoading(false);
    }
  };

  const handleChooseSupported = () => {
    setComingSoon(null);
    setQuery('');
    startEgyptPack();
  };

  const clearSearch = () => {
    Haptics.selectionAsync();
    setQuery('');
    setComingSoon(null);
    setDraftResult(null);
    setDraftError(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#071829', '#0B2540', '#0D2E35', '#071829']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient pulsing orbs */}
      <Animated.View
        style={[styles.orbTeal, { opacity: orbOpacity, transform: [{ scale: orbScale }] }]}
      />
      <Animated.View
        style={[styles.orbBlue, { opacity: orbOpacity, transform: [{ scale: orbScale }] }]}
      />
      <View style={styles.orbCoral} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            {/* ── Logo ── */}
            <View style={styles.logoBar}>
              <Image
                source={require('../../assets/app-icon.png')}
                style={styles.logoIcon}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>
                <Text style={styles.logoWhite}>Arrive</Text>
                <Text style={styles.logoTeal}>Pack</Text>
              </Text>
            </View>

            {/* ── Hero ── */}
            <View style={styles.hero}>
              <Text style={styles.heroTagline}>Plan first. Travel smarter.</Text>
              <Text style={styles.heroCopy}>
                Search your destination and build a simple travel readiness plan before you go.
              </Text>
            </View>

            {/* ── Search bar ── */}
            <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
              <Search size={20} color={focused ? '#17D9C8' : 'rgba(255,255,255,0.5)'} />
              <TextInput
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  if (comingSoon) setComingSoon(null);
                  if (draftResult) setDraftResult(null);
                  if (draftError) setDraftError(null);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={ROTATING_PLACEHOLDERS[placeholderIdx]}
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <Pressable onPress={clearSearch} hitSlop={10} style={styles.clearBtn}>
                  <X size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>
              )}
            </View>

            {/* ── Body: draft result / unsupported panel / empty / results ── */}
            {draftResult ? (
              <BasicDraftPanel
                draft={draftResult}
                onRequestPack={handleRequestPackFromDraft}
                onChooseSupported={handleChooseSupported}
                onBack={() => setDraftResult(null)}
              />
            ) : comingSoon ? (
              <UnsupportedPanel
                item={comingSoon}
                onBack={() => {
                  setComingSoon(null);
                  setDraftError(null);
                }}
                onBasicDraft={handleBasicDraft}
                onRequest={handleRequestPack}
                onChooseSupported={handleChooseSupported}
                isLoadingDraft={draftLoading}
                draftError={draftError}
              />
            ) : query.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.suggestLabel}>Popular destinations</Text>
                <View style={styles.chipRow}>
                  {QUICK_CHIPS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => handleChip(c)}
                      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                    >
                      <Text style={styles.chipText}>{c}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Trust badges */}
                <View style={styles.trustRow}>
                  {TRUST_BADGES.map((b) => (
                    <View key={b.label} style={styles.trustBadge}>
                      <b.icon size={13} color="#17D9C8" />
                      <Text style={styles.trustText}>{b.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : results.length > 0 ? (
              <View style={styles.results}>
                {results.map((item) => (
                  <ResultCard key={item.id} item={item} onPress={() => handleResultPress(item)} />
                ))}
              </View>
            ) : (
              <View style={styles.noResults}>
                <Text style={styles.noResultsEmoji}>🔍</Text>
                <Text style={styles.noResultsTitle}>No destination found</Text>
                <Text style={styles.noResultsSub}>
                  Try “Egypt”, or pick a popular destination below.
                </Text>
                <View style={styles.chipRow}>
                  {QUICK_CHIPS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => handleChip(c)}
                      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                    >
                      <Text style={styles.chipText}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppToast message={toast?.msg ?? ''} visible={toastVisible} emoji={toast?.emoji ?? '✅'} />
    </SafeAreaView>
  );
}

/* ─── Result card ─────────────────────────────────────────────── */

function ResultCard({
  item,
  onPress,
}: {
  item: DestinationRegistryItem;
  onPress: () => void;
}) {
  const isSupported = item.status === 'supported';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.resultCard,
        isSupported && styles.resultCardSupported,
        pressed && styles.resultPressed,
      ]}
    >
      <View style={[styles.resultEmojiWrap, isSupported && styles.resultEmojiWrapActive]}>
        <Text style={styles.resultEmoji}>{item.emoji}</Text>
      </View>

      <View style={styles.resultBody}>
        <View style={styles.resultTitleRow}>
          <Text style={styles.resultName}>{item.name}</Text>
          <View style={[styles.resultBadge, isSupported ? styles.badgeVerified : styles.badgeSoon]}>
            <Text style={[styles.resultBadgeText, isSupported && styles.badgeVerifiedText]}>
              {isSupported ? 'Verified Pack' : 'Coming soon'}
            </Text>
          </View>
        </View>
        <Text style={styles.resultDesc} numberOfLines={1}>
          {item.shortDescription}
        </Text>
      </View>

      <View style={[styles.resultCta, isSupported && styles.resultCtaActive]}>
        <Text style={[styles.resultCtaText, isSupported && styles.resultCtaTextActive]}>
          {isSupported ? 'Start' : 'Options'}
        </Text>
        <ChevronRight size={14} color={isSupported ? '#FFFFFF' : '#17D9C8'} />
      </View>
    </Pressable>
  );
}

/* ─── Unsupported panel ───────────────────────────────────────── */

function UnsupportedPanel({
  item,
  onBack,
  onBasicDraft,
  onRequest,
  onChooseSupported,
  isLoadingDraft,
  draftError,
}: {
  item: DestinationRegistryItem;
  onBack: () => void;
  onBasicDraft: () => void;
  onRequest: () => void;
  onChooseSupported: () => void;
  isLoadingDraft: boolean;
  draftError: string | null;
}) {
  const hasRequested = usePackRequestStore((s) => s.requestedPackIds.includes(item.id));

  return (
    <View style={styles.panel}>
      <Pressable onPress={onBack} style={styles.panelBack} hitSlop={8}>
        <ArrowLeft size={16} color="#17D9C8" />
        <Text style={styles.panelBackText}>Back to search</Text>
      </Pressable>

      <View style={styles.panelHeader}>
        <Text style={styles.panelEmoji}>{item.emoji}</Text>
        <View style={styles.panelHeaderText}>
          <Text style={styles.panelTitle}>{item.name} is not fully available yet.</Text>
          <View style={styles.notVerifiedBadge}>
            <Text style={styles.notVerifiedText}>Not verified yet</Text>
          </View>
        </View>
      </View>

      <Text style={styles.panelCopy}>
        ArrivePack can still help you start, but {item.name} does not have a verified destination
        pack yet. Critical details must be confirmed from official sources.
      </Text>

      {/* Error state */}
      {draftError && (
        <View style={styles.errorCard}>
          <AlertCircle size={16} color="#FB923C" />
          <View style={styles.errorBody}>
            <Text style={styles.errorTitle}>Couldn't create draft right now</Text>
            <Text style={styles.errorDesc}>{draftError}</Text>
          </View>
        </View>
      )}

      {/* 1. Basic draft */}
      <Pressable
        onPress={isLoadingDraft ? undefined : onBasicDraft}
        style={({ pressed }) => [
          styles.actionCard,
          isLoadingDraft && styles.actionCardLoading,
          !isLoadingDraft && pressed && styles.actionPressed,
        ]}
      >
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.18)' }]}>
          {isLoadingDraft ? (
            <ActivityIndicator size="small" color="#60A5FA" />
          ) : (
            <FileText size={18} color="#60A5FA" />
          )}
        </View>
        <View style={styles.actionBody}>
          <View style={styles.actionTitleRow}>
            <Text style={styles.actionTitle}>
              {isLoadingDraft ? 'Creating your basic planning draft…' : 'Create a basic planning draft'}
            </Text>
            {!isLoadingDraft && (
              <View style={styles.draftBadge}>
                <Text style={styles.draftBadgeText}>AI draft</Text>
              </View>
            )}
          </View>
          <Text style={styles.actionDesc}>
            {isLoadingDraft
              ? 'This usually takes a few seconds.'
              : 'Use a lighter AI-assisted planning draft with lower confidence.'}
          </Text>
        </View>
      </Pressable>

      {/* 2. Request pack */}
      <Pressable
        onPress={onRequest}
        disabled={hasRequested}
        style={({ pressed }) => [styles.actionCard, pressed && styles.actionPressed]}
      >
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(23,217,200,0.18)' }]}>
          <Send size={18} color="#17D9C8" />
        </View>
        <View style={styles.actionBody}>
          <Text style={styles.actionTitle}>
            {hasRequested ? `${item.name} Pack requested ✓` : `Request ${item.name} Pack`}
          </Text>
          <Text style={styles.actionDesc}>
            {hasRequested
              ? "Thanks — we'll prioritize this destination."
              : 'Tell us you want a verified guide for this destination.'}
          </Text>
        </View>
      </Pressable>

      {/* 3. Choose supported */}
      <Pressable
        onPress={onChooseSupported}
        style={({ pressed }) => [
          styles.actionCard,
          styles.actionCardPrimary,
          pressed && styles.actionPressed,
        ]}
      >
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(23,217,200,0.28)' }]}>
          <Check size={18} color="#17D9C8" />
        </View>
        <View style={styles.actionBody}>
          <Text style={styles.actionTitle}>Choose a supported destination</Text>
          <Text style={styles.actionDesc}>Start with the fully verified Egypt Pack.</Text>
        </View>
        <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
      </Pressable>
    </View>
  );
}

/* ─── Provider badge ──────────────────────────────────────────── */

const PROVIDER_CONFIG: Record<
  NonNullable<BasicDraftResult['provider']>,
  { label: string; bg: string; color: string }
> = {
  openrouter:           { label: 'Generated by AI',          bg: 'rgba(59,130,246,0.16)',   color: '#60A5FA' },
  database_cache:       { label: 'Saved draft',               bg: 'rgba(20,184,166,0.16)',  color: '#2DD4BF' },
  openrouter_uncached:  { label: 'Generated by AI · Not saved', bg: 'rgba(234,179,8,0.16)', color: '#FACC15' },
  mock:                 { label: 'Mock draft for MVP',        bg: 'rgba(255,255,255,0.1)',  color: 'rgba(255,255,255,0.55)' },
};

function ProviderBadge({ provider }: { provider?: BasicDraftResult['provider'] }) {
  const cfg = PROVIDER_CONFIG[provider ?? 'mock'];
  return (
    <View style={[styles.providerBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.providerBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

/* ─── Basic draft panel ────────────────────────────────────────── */

function BasicDraftPanel({
  draft,
  onRequestPack,
  onChooseSupported,
  onBack,
}: {
  draft: BasicDraftResult;
  onRequestPack: () => void;
  onChooseSupported: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.draftPanel}>
      <Pressable onPress={onBack} style={styles.panelBack} hitSlop={8}>
        <ArrowLeft size={16} color="#17D9C8" />
        <Text style={styles.panelBackText}>Back to options</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.draftHeader}>
        <Text style={styles.draftTitle}>Basic planning draft for {draft.destination}</Text>

        {/* Trust badge row */}
        <View style={styles.draftBadgeRow}>
          <View style={styles.draftNotVerified}>
            <AlertCircle size={11} color="#FBBF24" />
            <Text style={styles.draftNotVerifiedText}>Not verified</Text>
          </View>
          <ProviderBadge provider={draft.provider} />
        </View>

        <Text style={styles.draftDisclaimer}>{draft.disclaimer}</Text>
      </View>

      {/* Sections */}
      {draft.sections.map((section, i) => (
        <View key={i} style={styles.draftSection}>
          <View style={styles.draftSectionHeader}>
            <BookOpen size={13} color="rgba(255,255,255,0.45)" />
            <Text style={styles.draftSectionTitle}>{section.title}</Text>
            <View style={styles.draftLowBadge}>
              <Text style={styles.draftLowText}>Low confidence</Text>
            </View>
          </View>
          <Text style={styles.draftSectionSummary}>{section.summary}</Text>
          <Text style={styles.draftSourceReminder}>⚠ {section.sourceReminder}</Text>
        </View>
      ))}

      {/* CTAs */}
      <Pressable
        onPress={onRequestPack}
        style={({ pressed }) => [styles.draftCta, styles.draftCtaPrimary, pressed && styles.actionPressed]}
      >
        <Send size={16} color="#FFFFFF" />
        <Text style={styles.draftCtaText}>Request verified {draft.destination} Pack</Text>
      </Pressable>

      <Pressable
        onPress={onChooseSupported}
        style={({ pressed }) => [styles.draftCta, styles.draftCtaSecondary, pressed && styles.actionPressed]}
      >
        <Check size={16} color="#17D9C8" />
        <Text style={[styles.draftCtaText, { color: '#17D9C8' }]}>Choose Egypt Pack instead</Text>
      </Pressable>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#071829' },
  flex: { flex: 1 },

  /* Orbs */
  orbTeal: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#14B8A6',
    top: -90,
    right: -80,
  },
  orbBlue: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#3B82F6',
    top: height * 0.4,
    left: -80,
  },
  orbCoral: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FF6B5E',
    opacity: 0.06,
    bottom: 40,
    right: -50,
  },

  /* Content */
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 40,
  },

  /* Logo */
  logoBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: { width: 40, height: 40, borderRadius: 12 },
  logoText: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  logoWhite: { color: '#FFFFFF' },
  logoTeal: { color: '#17D9C8' },

  /* Hero */
  hero: { marginBottom: 22 },
  heroTagline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    lineHeight: 40,
  },
  heroCopy: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
    marginTop: 10,
  },

  /* Search bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 18,
    height: 60,
  },
  searchBarFocused: {
    borderColor: 'rgba(23,217,200,0.6)',
    backgroundColor: 'rgba(23,217,200,0.06)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    height: '100%',
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Empty state */
  emptyState: { marginTop: 28, gap: 14 },
  suggestLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  chipText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },

  /* Trust badges */
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(23,217,200,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(23,217,200,0.18)',
  },
  trustText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },

  /* Results */
  results: { marginTop: 22, gap: 12 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultCardSupported: {
    backgroundColor: 'rgba(23,217,200,0.08)',
    borderColor: 'rgba(23,217,200,0.4)',
  },
  resultPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  resultEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultEmojiWrapActive: { backgroundColor: 'rgba(23,217,200,0.18)' },
  resultEmoji: { fontSize: 26 },
  resultBody: { flex: 1, gap: 4 },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  resultName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeVerified: { backgroundColor: 'rgba(23,217,200,0.2)' },
  badgeSoon: { backgroundColor: 'rgba(255,255,255,0.1)' },
  resultBadgeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  badgeVerifiedText: { color: '#17D9C8' },
  resultDesc: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  resultCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  resultCtaActive: { backgroundColor: '#0EA5A0' },
  resultCtaText: { fontSize: 13, fontWeight: '700', color: '#17D9C8' },
  resultCtaTextActive: { color: '#FFFFFF' },

  /* No results */
  noResults: { marginTop: 36, alignItems: 'center', gap: 8 },
  noResultsEmoji: { fontSize: 36 },
  noResultsTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  noResultsSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: 8,
  },

  /* Unsupported panel */
  panel: { marginTop: 22, gap: 12 },
  panelBack: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  panelBackText: { color: '#17D9C8', fontSize: 14, fontWeight: '600' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  panelEmoji: { fontSize: 40 },
  panelHeaderText: { flex: 1, gap: 6 },
  panelTitle: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, lineHeight: 25 },
  notVerifiedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  notVerifiedText: { fontSize: 11, fontWeight: '700', color: '#FBBF24' },
  panelCopy: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 21, marginBottom: 4 },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionCardPrimary: {
    backgroundColor: 'rgba(23,217,200,0.08)',
    borderColor: 'rgba(23,217,200,0.35)',
  },
  actionPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionBody: { flex: 1, gap: 4 },
  actionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  actionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 19 },
  draftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.18)',
  },
  draftBadgeText: { fontSize: 10, fontWeight: '700', color: '#60A5FA' },

  /* Loading state for basic draft action card */
  actionCardLoading: {
    opacity: 0.75,
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(59,130,246,0.06)',
  },

  /* Error card */
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(251,146,60,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.25)',
  },
  errorBody: { flex: 1, gap: 2 },
  errorTitle: { fontSize: 13, fontWeight: '700', color: '#FB923C' },
  errorDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },

  /* Basic draft panel */
  draftPanel: { marginTop: 22, gap: 12 },
  draftHeader: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    gap: 10,
  },
  draftTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, lineHeight: 24 },
  draftNotVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  draftNotVerifiedText: { fontSize: 11, fontWeight: '700', color: '#FBBF24' },
  draftDisclaimer: { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 18 },

  draftSection: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  draftSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  draftSectionTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', flex: 1 },
  draftLowBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  draftLowText: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  draftSectionSummary: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },
  draftSourceReminder: { fontSize: 11, color: 'rgba(251,191,36,0.75)', lineHeight: 16 },

  draftCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  draftCtaPrimary: { backgroundColor: '#0EA5A0' },
  draftCtaSecondary: {
    backgroundColor: 'rgba(23,217,200,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(23,217,200,0.3)',
  },
  draftCtaText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  /* Provider badge */
  draftBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  providerBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  providerBadgeText: { fontSize: 10.5, fontWeight: '700' },
});
