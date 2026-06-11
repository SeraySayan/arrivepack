import type { ReadinessItem, ReadinessState } from '../types';

const STATUS_SCORES: Record<ReadinessItem['status'], number> = {
  ready: 100,
  suggested: 70,
  needs_review: 40,
  not_set: 0,
};

export function calculateReadinessScore(items: ReadinessItem[]): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + STATUS_SCORES[item.status], 0);
  return Math.round(total / items.length);
}

export function buildReadinessState(items: ReadinessItem[]): ReadinessState {
  return {
    items,
    score: calculateReadinessScore(items),
  };
}

export function updateItemStatus(
  state: ReadinessState,
  itemId: string,
  status: ReadinessItem['status']
): ReadinessState {
  const updated = state.items.map((item) =>
    item.id === itemId ? { ...item, status } : item
  );
  return buildReadinessState(updated);
}

export function getReadinessColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#FF6B5E';
}

export function getReadinessLabel(score: number): string {
  if (score >= 80) return 'Looking great!';
  if (score >= 60) return 'Getting there';
  if (score >= 40) return 'Needs attention';
  return 'Just getting started';
}
