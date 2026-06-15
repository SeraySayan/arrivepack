import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from '../../src/utils/haptics';
import { useTripStore } from '../../src/store/tripStore';
import DiaryPlaceCard from '../../src/components/trip/DiaryPlaceCard';
import TravelMemoryMap from '../../src/components/trip/TravelMemoryMap';
import AppButton from '../../src/components/ui/AppButton';
import EmptyState from '../../src/components/ui/EmptyState';
import AppToast from '../../src/components/ui/AppToast';
import FadeInView from '../../src/components/ui/FadeInView';
import { MOCK_PLACES } from '../../src/data/egypt';
import type { Place } from '../../src/types';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Radii, Spacing } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';

type DiaryTab = 'saved' | 'visited' | 'suggested';

const STAT_TINTS = [
  { bg: '#E6FFFA', value: '#0F766E' },
  { bg: '#ECFDF5', value: '#059669' },
  { bg: '#FFF1F0', value: '#E11D48' },
  { bg: '#EFF6FF', value: '#2563EB' },
];

export default function DiaryScreen() {
  const { trip, savePlace, unsavePlace, markPlaceVisited, favoritPlace, addDiaryNote } =
    useTripStore();
  const [activeTab, setActiveTab] = useState<DiaryTab>('saved');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [noteModalPlace, setNoteModalPlace] = useState<Place | null>(null);
  const [noteText, setNoteText] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const savedPlaces = trip?.savedPlaces ?? [];
  const visitedPlaces = trip?.visitedPlaces ?? [];
  const favorites = savedPlaces.filter((p) => p.isFavorite);

  const suggestedPlaces = MOCK_PLACES.filter((p) => !savedPlaces.some((sp) => sp.id === p.id));

  const statsData = [
    { label: 'Saved', value: savedPlaces.length, emoji: '🔖' },
    { label: 'Visited', value: visitedPlaces.length, emoji: '✅' },
    { label: 'Favorites', value: favorites.length, emoji: '❤️' },
    {
      label: 'Cities',
      value: new Set([...savedPlaces, ...visitedPlaces].map((p) => p.city)).size,
      emoji: '🏙️',
    },
  ];

  const handleSavePlace = (place: Place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    savePlace(place);
    showToast('Place saved to diary!');
  };

  const handleMarkVisited = (placeId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markPlaceVisited(placeId);
    showToast('Marked as visited! ✅');
  };

  const handleFavorite = (placeId: string) => {
    favoritPlace(placeId);
  };

  const handleSaveNote = () => {
    if (noteModalPlace) {
      addDiaryNote(noteModalPlace.id, noteText);
      setNoteModalPlace(null);
      showToast('Note saved!');
    }
  };

  const renderPlaces = () => {
    if (activeTab === 'saved') {
      if (savedPlaces.length === 0) {
        return (
          <EmptyState
            emoji="🔖"
            title="No saved places yet"
            description="Explore the suggested tab and save places you want to visit."
          />
        );
      }
      return savedPlaces.map((place) => (
        <DiaryPlaceCard
          key={place.id}
          place={place}
          onMarkVisited={() => handleMarkVisited(place.id)}
          onFavorite={() => handleFavorite(place.id)}
          onAddNote={() => {
            setNoteText(place.userNote ?? '');
            setNoteModalPlace(place);
          }}
        />
      ));
    }

    if (activeTab === 'visited') {
      if (visitedPlaces.length === 0) {
        return (
          <EmptyState
            emoji="🗺️"
            title="No places visited yet"
            description="Your map will come alive as you explore. Mark places as visited to track your journey."
          />
        );
      }
      return visitedPlaces.map((place) => (
        <DiaryPlaceCard
          key={place.id}
          place={{ ...place, isVisited: true }}
          onMarkVisited={() => {}}
          onFavorite={() => handleFavorite(place.id)}
        />
      ));
    }

    if (activeTab === 'suggested') {
      return suggestedPlaces.map((place) => (
        <View key={place.id} style={styles.suggestedCard}>
          <View style={styles.suggestedInfo}>
            <Text style={styles.suggestedName}>{place.name}</Text>
            <Text style={styles.suggestedMeta}>
              {place.category} · {place.city}
            </Text>
            <Text style={styles.suggestedDesc}>{place.shortDescription}</Text>
          </View>
          <Pressable onPress={() => handleSavePlace(place)} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>+ Save</Text>
          </Pressable>
        </View>
      ));
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <FadeInView>
          <Text style={styles.title}>Travel Diary</Text>
          <Text style={styles.subtitle}>🇪🇬 Your Egypt trip memory</Text>
        </FadeInView>

        {/* Stats */}
        <FadeInView delay={60}>
          <View style={styles.statsRow}>
            {statsData.map((stat, i) => (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statEmojiWrap, { backgroundColor: STAT_TINTS[i].bg }]}>
                  <Text style={styles.statEmoji}>{stat.emoji}</Text>
                </View>
                <Text style={[styles.statValue, { color: STAT_TINTS[i].value }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Travel memory map */}
        <FadeInView delay={120}>
          <TravelMemoryMap savedPlaces={savedPlaces} visitedPlaces={visitedPlaces} />
        </FadeInView>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['saved', 'visited', 'suggested'] as DiaryTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'saved'
                  ? `Saved (${savedPlaces.length})`
                  : tab === 'visited'
                  ? `Visited (${visitedPlaces.length})`
                  : 'Discover'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <View style={styles.places}>{renderPlaces()}</View>
      </ScrollView>

      {/* Note modal */}
      <Modal visible={!!noteModalPlace} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setNoteModalPlace(null)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add a note</Text>
            <Text style={styles.modalSub}>{noteModalPlace?.name}</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="What did you think? What stood out?"
              placeholderTextColor={Colors.mutedLight}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <AppButton label="Cancel" onPress={() => setNoteModalPlace(null)} variant="ghost" />
              <AppButton label="Save note" onPress={handleSaveNote} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AppToast message={toastMessage} visible={toastVisible} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FA' },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 130,
    paddingTop: Spacing.base,
  },
  title: { ...Typography.displayMd, color: Colors.text, letterSpacing: -0.4 },
  subtitle: { ...Typography.body, color: Colors.muted, marginTop: 4, marginBottom: Spacing.lg },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.base },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardWhite,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  statEmojiWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statEmoji: { fontSize: 17 },
  statValue: { ...Typography.h2, fontWeight: '800' },
  statLabel: { ...Typography.caption, color: Colors.muted, textAlign: 'center', fontSize: 11 },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E9EEF5',
    borderRadius: Radii.full,
    padding: 4,
    marginBottom: Spacing.base,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: Radii.full, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.cardWhite, ...Shadows.sm },
  tabText: { ...Typography.captionBold, color: Colors.muted, fontWeight: '600' },
  tabTextActive: { color: Colors.tealDark, fontWeight: '800' },

  places: { gap: Spacing.md },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: 18,
    padding: Spacing.cardPad,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  suggestedInfo: { flex: 1, gap: 3 },
  suggestedName: { ...Typography.h4, color: Colors.text, fontWeight: '700' },
  suggestedMeta: { ...Typography.caption, color: Colors.muted },
  suggestedDesc: { ...Typography.caption, color: Colors.mutedLight },
  saveBtn: {
    backgroundColor: Colors.mint,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
  },
  saveBtnText: { ...Typography.captionBold, color: Colors.tealDark, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  modalDismiss: { flex: 1 },
  modalCard: {
    backgroundColor: Colors.cardWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.xl,
    gap: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: { ...Typography.h2, color: Colors.text },
  modalSub: { ...Typography.body, color: Colors.muted },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.cardPad,
    ...Typography.body,
    color: Colors.text,
    minHeight: 100,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.base, justifyContent: 'flex-end' },
});
