import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Heart, MapPin, CheckCircle } from 'lucide-react-native';
import * as Haptics from '../../utils/haptics';
import type { Place } from '../../types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

interface Props {
  place: Place;
  onMarkVisited: () => void;
  onFavorite: () => void;
  onAddNote?: () => void;
}

export default function DiaryPlaceCard({ place, onMarkVisited, onFavorite, onAddNote }: Props) {
  return (
    <View style={[styles.card, place.isVisited && styles.visitedCard]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MapPin size={18} color={Colors.teal} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{place.name}</Text>
          <Text style={styles.meta}>{place.category} · {place.city}</Text>
        </View>
        {place.isVisited && (
          <View style={styles.visitedBadge}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.visitedText}>Visited</Text>
          </View>
        )}
      </View>

      <Text style={styles.description}>{place.shortDescription}</Text>

      {place.userNote && (
        <View style={styles.noteBlock}>
          <Text style={styles.noteIcon}>✏️</Text>
          <Text style={styles.noteText}>{place.userNote}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {!place.isVisited && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onMarkVisited();
            }}
            style={styles.actionBtn}
          >
            <CheckCircle size={16} color={Colors.teal} />
            <Text style={styles.actionText}>Mark visited</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onFavorite();
          }}
          style={styles.actionBtn}
        >
          <Heart
            size={16}
            color={place.isFavorite ? Colors.coral : Colors.muted}
            fill={place.isFavorite ? Colors.coral : 'none'}
          />
          <Text style={[styles.actionText, place.isFavorite && styles.favoriteText]}>
            {place.isFavorite ? 'Favorited' : 'Favorite'}
          </Text>
        </Pressable>
        {onAddNote && (
          <Pressable onPress={onAddNote} style={styles.actionBtn}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Add note</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: Radii.card,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  visitedCard: {
    borderColor: Colors.success + '40',
    backgroundColor: Colors.successLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  name: {
    ...Typography.h4,
    color: Colors.text,
  },
  meta: {
    ...Typography.caption,
    color: Colors.muted,
    marginTop: 2,
  },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  visitedText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  noteBlock: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.yellowLight,
    padding: Spacing.sm,
    borderRadius: 8,
  },
  noteIcon: {
    fontSize: 13,
  },
  noteText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.base,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.muted,
    fontWeight: '500',
  },
  favoriteText: {
    color: Colors.coral,
  },
  actionIcon: {
    fontSize: 14,
  },
});
