import type { Href } from 'expo-router';

import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';

type ShopSku = keyof typeof ECONOMY_CONTRACT_V1.shop;

const FREEZE_SKU: ShopSku = 'streak_freeze_basic';

/**
 * Item detail for the catalogue's Streak Freeze. `/shop/[id]` resolves either
 * a catalogue id or a SKU, so the contract SKU is a stable deep link.
 */
export const STREAK_FREEZE_SHOP_HREF = `/shop/${FREEZE_SKU}` as Href;
