import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import type { StayAreaId } from '../../src/types';
import { router } from 'expo-router';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import { getActiveItinerary } from '../../src/services/itineraryEngine';
import ItineraryDayCard from '../../src/components/trip/ItineraryDayCard';
import EmptyState from '../../src/components/ui/EmptyState';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { formatBudgetStyle, formatTravelStyle } from '../../src/utils/formatters';
import type { ItineraryDay, CostLevel } from '../../src/types';

/* ── AI-adjusted day ⟶ ItineraryDay adapter ── */

/** Rich per-activity object inside a detailSection. */
interface AiDetailItem {
  title: string;
  description?: string;
  duration?: string;
  costLevel?: string;
  transport?: string;
  tip?: string;
}

/** Full AI day shape — activities list is always present; detailSections is optional. */
interface AiDayInput {
  day: number;
  title: string;
  subtitle: string;
  activities: string[];
  chips: string[];
  costLevel: string;
  detailSections?: {
    morning?: AiDetailItem[];
    afternoon?: AiDetailItem[];
    evening?: AiDetailItem[];
  };
}

const AI_COST_MAP: Record<string, CostLevel> = {
  budget: 'low',
  moderate: 'medium',
  premium: 'high',
};

const AI_TRUST = {
  sourceType: 'sample_data' as const,
  confidence: 'medium' as const,
  lastCheckedLabel: 'AI adjusted',
};

/* ── Fallback description generator for AI-adjusted activities ──────────────
 * Used when the AI returns an activity without a description (or with an empty
 * one). Produces a single safe sentence based on the activity title and slot.
 * Never invents prices, opening hours, or official facts. */

function createAiFallbackDescription(
  title: string,
  _dayTitle: string,
  _daySubtitle: string,
  slot: string,
): string {
  const t = title.toLowerCase();

  // ── Arrival / departure / airport ──
  if (/arriv|airport|land|fly in|flight/.test(t)) {
    return 'Keep arrival simple so the first day stays calm and low-stress.';
  }
  if (/depart|departure|fly out|head to airport|transfer.*airport/.test(t)) {
    return 'Head to the airport with time to spare and no last-minute rushing.';
  }

  // ── Check-in / rest / settle ──
  if (/check.?in|check out|settle|freshen|rest|recover/.test(t) && !/restaurant|café|cafe/.test(t)) {
    return 'Use this block to recover from travel before adding more plans.';
  }

  // ── Food & drink — slot-aware ──
  if (/lunch|كoshary|koshari|kushari|ful|foul|falafel|local food|street food|food tour/.test(t)) {
    return 'Add a local food stop without turning the day into another walking-heavy block.';
  }
  if (/dinner|evening meal|restaurant|café|cafe|eat|meal/.test(t)) {
    return 'Wind down with a good local meal and keep the evening light.';
  }
  if (/breakfast/.test(t)) {
    return 'Start the day with a relaxed breakfast before the main activity.';
  }

  // ── Market / bazaar / shopping ──
  if (/bazaar|khan el|souk|market|shop/.test(t)) {
    return 'Explore the area at a focused pace instead of trying to cover too much.';
  }

  // ── Pyramids / Sphinx / Giza ──
  if (/pyramid|sphinx|giza|sakkara|saqqara|step pyramid/.test(t)) {
    if (/early/.test(t)) {
      return 'Visit the main highlight early, then keep the rest of the day lighter.';
    }
    return 'One of the world\'s great sites — keep the schedule around it intentionally loose.';
  }

  // ── Cairo / Islamic / Coptic / Old Cairo ──
  if (/citadel|islamic cairo|coptic|old cairo|al.azhar|city of the dead|hussein/.test(t)) {
    return 'Explore the historic quarter without a rushed agenda.';
  }
  if (/egyptian museum|grand egyptian|museum/.test(t)) {
    return 'Focus on a few key sections rather than trying to see everything in one go.';
  }

  // ── Luxor / Karnak / West Bank ──
  if (/karnak|luxor temple|west bank|hatshepsut|colossi|memnon|valley of the kings|deir/.test(t)) {
    return 'Take in the monuments without rushing — slow pacing makes these visits better.';
  }

  // ── Aswan / Philae / Abu Simbel / Nile ──
  if (/philae|abu simbel|high dam|aswan|nubian|felucca|nile cruise/.test(t)) {
    return 'A calmer section of the route — let the landscape and scale do the work.';
  }

  // ── Nile / boat / cruise (generic) ──
  if (/nile|boat|cruise|felucca|sailing/.test(t)) {
    return 'A relaxing way to see the city from the water without adding more walking.';
  }

  // ── Evening walk / stroll / corniche ──
  if (/stroll|walk|wander|evening|corniche|nile view|sunset/.test(t)) {
    return 'An easy end to the day — no major sightseeing, just a calm evening pace.';
  }

  // ── Slot-based generic fallback ──
  if (slot === 'mor' || slot === 'morning') {
    return 'Start the day calmly before moving into the main activity.';
  }
  if (slot === 'aft' || slot === 'afternoon') {
    return 'A well-paced mid-day block — kept lighter to balance the morning.';
  }
  if (slot === 'eve' || slot === 'evening') {
    return 'Wind down the day at a relaxed pace without adding a heavy block.';
  }

  return 'Part of a well-paced day — kept intentionally light.';
}

function aiDetailToActivity(
  item: AiDetailItem,
  dayNum: number,
  slot: string,
  idx: number,
  fallbackCost: CostLevel,
  dayTitle: string,
  daySubtitle: string,
): import('../../src/types').Activity {
  // Use fallback only when both description and tip are absent or empty
  const description = item.description?.trim() ||
    createAiFallbackDescription(item.title, dayTitle, daySubtitle, slot);
  return {
    id: `ai_d${dayNum}_${slot}${idx}`,
    title: item.title,
    description,
    category: 'Activity',
    estimatedDuration: item.duration ?? '',
    estimatedCostLevel: AI_COST_MAP[item.costLevel ?? ''] ?? fallbackCost,
    transportNote: item.transport ?? '',
    whyItFits: item.tip ?? '',
    trust: AI_TRUST,
  };
}

function aiDayToItineraryDay(aiDay: AiDayInput): ItineraryDay {
  const dayLevel: CostLevel = AI_COST_MAP[aiDay.costLevel] ?? 'medium';

  /* ── Use detailSections when the AI provides them ── */
  const secs = aiDay.detailSections;
  const hasDetailSections =
    secs != null &&
    typeof secs === 'object' &&
    (Array.isArray(secs.morning) || Array.isArray(secs.afternoon) || Array.isArray(secs.evening));

  if (hasDetailSections && secs) {
    return {
      day: aiDay.day,
      title: aiDay.title,
      theme: aiDay.subtitle,
      summary: aiDay.subtitle,
      chips: aiDay.chips,
      morning: (secs.morning ?? []).map((a, i) =>
        aiDetailToActivity(a, aiDay.day, 'mor', i, dayLevel, aiDay.title, aiDay.subtitle)),
      afternoon: (secs.afternoon ?? []).map((a, i) =>
        aiDetailToActivity(a, aiDay.day, 'aft', i, dayLevel, aiDay.title, aiDay.subtitle)),
      evening: (secs.evening ?? []).map((a, i) =>
        aiDetailToActivity(a, aiDay.day, 'eve', i, dayLevel, aiDay.title, aiDay.subtitle)),
      alternatives: [],
      estimatedCostLevel: dayLevel,
      transportSuggestion: '',
    };
  }

  /* ── Fallback: distribute simple string activities by keyword ── */
  const mkAct = (title: string, slot: string, i: number): import('../../src/types').Activity => ({
    id: `ai_d${aiDay.day}_${slot}${i}`,
    title,
    description: createAiFallbackDescription(title, aiDay.title, aiDay.subtitle, slot),
    category: 'Activity',
    estimatedDuration: '',
    estimatedCostLevel: dayLevel,
    transportNote: '',
    whyItFits: '',
    trust: AI_TRUST,
  });

  const eveningKw = /dinner|evening|night|stroll|bar|restaurant|sunset|corniche/i;
  const afternoonKw = /lunch|afternoon|rest|museum|citadel|shopping|second|temple|valley|pm/i;
  const morningKw = /morning|breakfast|arrive|airport|check.?in|early|pyramid|sphinx|depart/i;

  const morningActs: import('../../src/types').Activity[] = [];
  const afternoonActs: import('../../src/types').Activity[] = [];
  const eveningActs: import('../../src/types').Activity[] = [];

  for (const title of aiDay.activities ?? []) {
    if (eveningKw.test(title)) {
      eveningActs.push(mkAct(title, 'eve', eveningActs.length));
    } else if (afternoonKw.test(title)) {
      afternoonActs.push(mkAct(title, 'aft', afternoonActs.length));
    } else if (morningKw.test(title)) {
      morningActs.push(mkAct(title, 'mor', morningActs.length));
    } else {
      // Distribute to the least-filled slot
      if (morningActs.length <= afternoonActs.length && morningActs.length <= eveningActs.length) {
        morningActs.push(mkAct(title, 'mor', morningActs.length));
      } else if (afternoonActs.length <= eveningActs.length) {
        afternoonActs.push(mkAct(title, 'aft', afternoonActs.length));
      } else {
        eveningActs.push(mkAct(title, 'eve', eveningActs.length));
      }
    }
  }

  return {
    day: aiDay.day,
    title: aiDay.title,
    theme: aiDay.subtitle,
    summary: aiDay.subtitle,
    chips: aiDay.chips,
    morning: morningActs,
    afternoon: afternoonActs,
    evening: eveningActs,
    alternatives: [],
    estimatedCostLevel: dayLevel,
    transportSuggestion: '',
  };
}

/* ── Supabase URL helper ── */

function getSupabaseUrl(): string {
  // Expo exposes this via EXPO_PUBLIC_ prefix
  const url: string =
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_SUPABASE_URL : undefined) ?? '';
  return url;
}

export default function ItineraryScreen() {
  const { trip, setAdjustedItinerary, clearAdjustedItinerary } = useTripStore();

  // Single shared source of truth: AI-adjusted when available, engine otherwise.
  // Both this page and day.tsx call the same selector so they never disagree.
  const itinerary = getActiveItinerary(trip);

  // AI card UI state — local only (loading / error feedback for this session)
  const [aiRequest, setAiRequest] = useState('');
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  // Session-level feedback shown only after a successful adjustment in this session
  const [sessionSummary, setSessionSummary] = useState('');
  const [sessionChanges, setSessionChanges] = useState<string[]>([]);

  const scrollRef = useRef<ScrollView>(null);

  const isAiActive = Boolean(trip?.adjustedItinerary?.length);

  // Summary/changes to show: prefer session values (freshly returned), fall back to persisted store
  const aiSummary = sessionSummary || trip?.itinerarySummary || '';
  const aiChanges = sessionChanges.length > 0 ? sessionChanges : (trip?.itineraryChangesMade ?? []);

  if (!trip || itinerary.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <EmptyState
          emoji="🗓️"
          title="No itinerary yet"
          description="Create a trip to see your personalised day-by-day plan."
        />
      </SafeAreaView>
    );
  }

  const handleAiSubmit = async () => {
    if (!aiRequest.trim() || aiState === 'loading') return;

    Haptics.selectionAsync();
    setAiState('loading');
    setSessionSummary('');
    setSessionChanges([]);

    // Prepare a compact version of the current itinerary for the AI
    const compactItinerary = itinerary.map((day) => ({
      day: day.day,
      title: day.title,
      subtitle: day.theme,
      activities: [
        ...(day.morning ?? []),
        ...(day.afternoon ?? []),
        ...(day.evening ?? []),
      ].map((a) => a.title).slice(0, 3),
      chips: day.chips ?? [],
      costLevel:
        day.estimatedCostLevel === 'low'
          ? 'budget'
          : day.estimatedCostLevel === 'high'
          ? 'premium'
          : 'moderate',
    }));

    const supabaseUrl = getSupabaseUrl();
    if (!supabaseUrl) {
      setAiState('error');
      return;
    }

    const endpoint = `${supabaseUrl}/functions/v1/adjust-itinerary`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRequest: aiRequest.trim(),
          destination: trip.destinationName,
          durationDays: trip.durationDays,
          budgetStyle: trip.budgetStyle,
          travelStyle: trip.travelStyle,
          stayArea: trip.stayArea ?? 'unknown',
          currentItinerary: compactItinerary,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error('[adjust-itinerary] request failed', {
          httpStatus: res.status,
          error: data?.error,
          reason: data?.reason,
          detail: data?.detail,
        });
        setAiState('error');
        return;
      }

      // Map AI response days → full ItineraryDay objects
      const adjusted: ItineraryDay[] = (data.days ?? []).map(aiDayToItineraryDay);

      // Strict validation — must cover every day of the trip exactly
      if (adjusted.length !== trip.durationDays) {
        console.warn(
          `[itinerary] AI returned ${adjusted.length} days for a ${trip.durationDays}-day trip — rejecting`
        );
        setAiState('error');
        return;
      }

      // Write to shared store (with context snapshot) so day.tsx reads the same source
      const summary = data.summary ?? '';
      const changesMade: string[] = data.changesMade ?? [];
      setAdjustedItinerary(adjusted, summary, changesMade);
      setSessionSummary(summary);
      setSessionChanges(changesMade);
      setAiState('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Scroll to top to reveal updated cards
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 300);
    } catch (err) {
      console.error('adjust-itinerary fetch error:', err);
      setAiState('error');
    }
  };

  const handleResetToDefault = () => {
    Haptics.selectionAsync();
    clearAdjustedItinerary();
    setAiState('idle');
    setSessionSummary('');
    setSessionChanges([]);
    setAiRequest('');
  };

  const STAY_AREA_NAMES: Record<StayAreaId, string> = {
    zamalek: 'Zamalek',
    downtown: 'Downtown Cairo',
    garden_city: 'Garden City',
    giza: 'Giza',
    new_cairo: 'New Cairo',
  };

  const stayAreaNote = trip.stayArea
    ? `Using ${STAY_AREA_NAMES[trip.stayArea] ?? trip.stayArea} as your Cairo base.`
    : 'Sample plan based on your trip style. Choose a Cairo stay area to make local planning smarter.';

  const hasStayArea = Boolean(trip.stayArea);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <Text style={styles.title}>Your {trip.durationDays}-day Egypt plan</Text>
          <Text style={styles.subtitle}>
            {formatBudgetStyle(trip.budgetStyle)} · {formatTravelStyle(trip.travelStyle)}
            {trip.stayArea ? ` · ${trip.stayArea.replace('_', ' ')}` : ''}
          </Text>

          <View style={styles.trustBanner}>
            <View style={styles.trustBannerRow}>
              <Text style={styles.trustBannerTitle}>
                {isAiActive ? 'AI-adjusted plan' : 'Flexible sample plan'}
              </Text>
              <View style={[styles.trustBannerBadge, isAiActive && styles.trustBannerBadgeAi]}>
                <Text style={[styles.trustBannerBadgeText, isAiActive && styles.trustBannerBadgeTextAi]}>
                  {isAiActive ? 'AI adjusted' : 'Sample itinerary'}
                </Text>
              </View>
            </View>
            <Text style={styles.trustText}>
              {isAiActive
                ? 'Your itinerary was reshaped by AI based on your request. Verified travel facts should still be checked from official sources.'
                : 'Built from your travel style. Adjust days based on weather, energy, opening hours, and bookings.'}
            </Text>

            {/* Stay area context note */}
            {!isAiActive && (
              <View style={styles.stayAreaNote}>
                <Text style={styles.stayAreaNoteIcon}>
                  {hasStayArea ? '📍' : '💡'}
                </Text>
                <Text style={[styles.stayAreaNoteText, hasStayArea && styles.stayAreaNoteTextActive]}>
                  {stayAreaNote}
                </Text>
              </View>
            )}

            {isAiActive && (
              <Pressable onPress={handleResetToDefault} style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>↩ Restore original plan</Text>
              </Pressable>
            )}
          </View>

          {/* AI success summary card — shown when AI is active and there is something to display */}
          {isAiActive && (aiSummary || aiChanges.length > 0) && (
            <View style={styles.aiSuccessCard}>
              <View style={styles.aiSuccessHeader}>
                <Text style={styles.aiSuccessEmoji}>✨</Text>
                <Text style={styles.aiSuccessTitle}>Plan updated</Text>
              </View>
              {aiSummary ? (
                <Text style={styles.aiSuccessSummary}>{aiSummary}</Text>
              ) : null}
              {aiChanges.length > 0 && (
                <View style={styles.aiChangesList}>
                  {aiChanges.slice(0, 3).map((c, i) => (
                    <View key={i} style={styles.aiChangesRow}>
                      <View style={styles.aiChangesDot} />
                      <Text style={styles.aiChangesText}>{c}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Day cards */}
          <View style={styles.list}>
            {itinerary.map((day, i) => (
              <ItineraryDayCard
                key={`${day.day}-${isAiActive ? 'ai' : 'base'}`}
                day={day}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push({
                    pathname: '/trip/day',
                    params: { dayIndex: i },
                  });
                }}
              />
            ))}
          </View>

          {/* ── AI adjustment card ── */}
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <Text style={styles.aiCardTitle}>Adjust this plan with AI</Text>
              <View style={styles.aiCardBadge}>
                <Text style={styles.aiCardBadgeText}>Beta</Text>
              </View>
            </View>
            <Text style={styles.aiCardSubtitle}>
              Tell ArrivePack what you want to change. We'll keep the plan short, practical, and based on your trip style.
            </Text>

            <TextInput
              style={[styles.aiTextarea, aiState === 'loading' && styles.aiTextareaDisabled]}
              value={aiRequest}
              onChangeText={setAiRequest}
              placeholder="Example: Make this plan more relaxed, reduce walking, and add more local food."
              placeholderTextColor={Colors.mutedLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={aiState !== 'loading'}
              returnKeyType="default"
            />

            {aiState === 'error' && (
              <View style={styles.aiErrorRow}>
                <Text style={styles.aiErrorText}>
                  Couldn't update the plan right now. Your original itinerary is still saved.
                </Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.aiSubmitBtn,
                (!aiRequest.trim() || aiState === 'loading') && styles.aiSubmitBtnDisabled,
                pressed && styles.aiSubmitBtnPressed,
              ]}
              onPress={handleAiSubmit}
              disabled={!aiRequest.trim() || aiState === 'loading'}
            >
              {aiState === 'loading' ? (
                <View style={styles.aiLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.aiSubmitBtnText}>Updating your plan…</Text>
                </View>
              ) : (
                <Text style={styles.aiSubmitBtnText}>Update my itinerary</Text>
              )}
            </Pressable>

            <Text style={styles.aiDisclaimer}>
              AI adjusts your plan — verified travel facts should still be checked from official sources.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 100,
    paddingTop: Spacing.base,
    gap: Spacing.base,
  },
  back: { paddingVertical: Spacing.xs },
  backText: { ...Typography.body, color: Colors.teal, fontWeight: '600' },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.muted, marginTop: 4 },

  trustBanner: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  trustBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  trustBannerTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  trustBannerBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustBannerBadgeAi: {
    backgroundColor: '#CCFBF1',
    borderColor: '#99F6E4',
  },
  trustBannerBadgeText: { fontSize: 10, fontWeight: '600', color: Colors.mutedLight },
  trustBannerBadgeTextAi: { color: '#0D9488' },
  trustText: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  stayAreaNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 7,
    marginTop: 1,
  },
  stayAreaNoteIcon: { fontSize: 11, marginTop: 1 },
  stayAreaNoteText: {
    flex: 1,
    fontSize: 11,
    color: Colors.mutedLight,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  stayAreaNoteTextActive: {
    color: Colors.tealDark,
    fontStyle: 'normal',
    fontWeight: '600',
  },
  resetBtn: { alignSelf: 'flex-start', marginTop: 2 },
  resetBtnText: { fontSize: 12, fontWeight: '600', color: Colors.teal },

  /* AI success card */
  aiSuccessCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 6,
  },
  aiSuccessHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiSuccessEmoji: { fontSize: 16 },
  aiSuccessTitle: { fontSize: 14, fontWeight: '700', color: '#0D9488' },
  aiSuccessSummary: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  aiChangesList: { gap: 4, marginTop: 2 },
  aiChangesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  aiChangesDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#14B8A6', marginTop: 4, flexShrink: 0 },
  aiChangesText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 17 },

  list: { gap: Spacing.sm },

  /* AI adjustment card */
  aiCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  aiCardBadge: {
    backgroundColor: Colors.teal + '20',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.teal + '40',
  },
  aiCardBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.tealDark },
  aiCardSubtitle: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  aiTextarea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    padding: Spacing.base,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
    minHeight: 90,
    lineHeight: 20,
  },
  aiTextareaDisabled: { opacity: 0.55 },
  aiErrorRow: {
    backgroundColor: '#FEF2F2',
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  aiErrorText: { fontSize: 13, color: '#B91C1C', lineHeight: 18 },
  aiSubmitBtn: {
    backgroundColor: Colors.teal,
    borderRadius: Radii.full,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSubmitBtnDisabled: { backgroundColor: Colors.borderLight, opacity: 0.7 },
  aiSubmitBtnPressed: { opacity: 0.85 },
  aiSubmitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.1 },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiDisclaimer: {
    ...Typography.caption,
    color: Colors.mutedLight,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
