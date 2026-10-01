import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type ActivityItem = Pick<
  Database['public']['Tables']['notifications']['Row'],
  'id' | 'user_id' | 'title' | 'body' | 'payload' | 'is_read' | 'created_at'
>;

/** Receipts only: pending, deferred and skipped pushes must not become new alerts. */
export const loadActivityInbox = async (
  userId: string
): Promise<ActivityItem[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,user_id,title,body,payload,is_read,created_at')
    .eq('user_id', userId)
    .not('delivered_at', 'is', null)
    .is('delivery_error', null)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
};

export const markActivityRead = async (
  userId: string,
  id: number
): Promise<void> => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, opened_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Activity receipt was not saved.');
};
