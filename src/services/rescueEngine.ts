import type { AlternativeActivity, RescueScenario, BudgetStyle } from '../types';
import { getAlternatives } from '../data/mockRescue';

export function getRescueAlternatives(
  scenario: RescueScenario,
  _budgetStyle: BudgetStyle
): AlternativeActivity[] {
  return getAlternatives(scenario);
}
