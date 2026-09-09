import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';

export type ActionCostKey = 'create_group' | 'create_challenge' | 'join_group';

export type ActionCosts = Record<ActionCostKey, number>;

export const DEFAULT_ACTION_COSTS: ActionCosts = {
  create_group: ECONOMY_CONTRACT_V1.costs.create_group,
  create_challenge: ECONOMY_CONTRACT_V1.costs.create_challenge,
  join_group: ECONOMY_CONTRACT_V1.costs.join_group,
};

export function formatCost(amount: number): string {
  return `− ${amount} Momenta`;
}
