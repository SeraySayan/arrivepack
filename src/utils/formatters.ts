export function formatDuration(days: number): string {
  return days === 1 ? '1 day' : `${days} days`;
}

export function formatBudgetStyle(style: string): string {
  const map: Record<string, string> = {
    smart_budget: 'Smart Budget',
    balanced_experience: 'Balanced Experience',
    premium_comfort: 'Premium Comfort',
  };
  return map[style] ?? style;
}

export function formatTravelStyle(style: string): string {
  const map: Record<string, string> = {
    first_time_must_sees: 'First-time must-sees',
    explore_like_local: 'Explore like a local',
    relaxed_safe: 'Relaxed & safe',
    history_culture: 'History & culture',
    food_local: 'Food & local',
    photo_video: 'Photo / video',
    romantic: 'Romantic',
    family_friendly: 'Family-friendly',
    adventure: 'Adventure',
  };
  return map[style] ?? style;
}

export function formatCostLevel(level: string): string {
  const map: Record<string, string> = {
    low: 'Budget-friendly',
    medium: 'Moderate',
    high: 'Higher cost',
  };
  return map[level] ?? level;
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
