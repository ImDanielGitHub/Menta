import { supabase } from '@/lib/supabase';

export async function claimStreakShopUnlocks(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('claim_streak_shop_unlocks');
    return !error;
  } catch {
    return false;
  }
}
