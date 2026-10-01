import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { appStateManager } from '@/lib/app-state-manager';
import {
  loadActivityInbox,
  markActivityRead,
  type ActivityItem,
} from '@/lib/notifications/activity-inbox';

export const useActivityInbox = () => {
  const userId = useAuthStore(state =>
    state.isAuthenticated ? state.user?.id : undefined
  );
  const currentUser = useRef(userId);
  currentUser.current = userId;
  const [state, setState] = useState<{
    owner?: string;
    items: ActivityItem[];
    loading: boolean;
    failed: boolean;
  }>({ items: [], loading: true, failed: false });
  const requestVersion = useRef(0);
  const mounted = useRef(false);
  const refreshRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    setState({
      owner: userId,
      items: [],
      loading: Boolean(userId),
      failed: false,
    });
    const refresh = async () => {
      if (!userId) return;
      const version = ++requestVersion.current;
      try {
        const items = await loadActivityInbox(userId);
        if (
          active &&
          version === requestVersion.current &&
          currentUser.current === userId
        ) {
          setState({ owner: userId, items, loading: false, failed: false });
        }
      } catch {
        if (
          active &&
          version === requestVersion.current &&
          currentUser.current === userId
        ) {
          setState(previous => ({ ...previous, loading: false, failed: true }));
        }
      }
    };
    refreshRef.current = refresh;
    if (!userId)
      return () => {
        active = false;
        mounted.current = false;
      };
    void refresh();
    // Re-fetch UPDATEs too: queued INSERTs are not receipts until delivery finishes.
    const channel = supabase
      .channel(`activity-inbox:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();
    const removeListener = appStateManager.addListener(next => {
      if (next === 'active') void refresh();
    });
    return () => {
      active = false;
      mounted.current = false;
      removeListener();
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const markRead = useCallback(
    async (id: number) => {
      if (!userId) return false;
      await markActivityRead(userId, id);
      if (!mounted.current || currentUser.current !== userId) return false;
      // A fetch started before this confirmed write cannot restore stale unread state.
      requestVersion.current += 1;
      setState(previous =>
        previous.owner === userId
          ? {
              ...previous,
              items: previous.items.map(item =>
                item.id === id ? { ...item, is_read: true } : item
              ),
            }
          : previous
      );
      return true;
    },
    [userId]
  );

  return {
    items: state.owner === userId ? state.items : [],
    loading: state.owner !== userId || state.loading,
    failed: state.owner === userId && state.failed,
    markRead,
    refresh: () => refreshRef.current(),
  };
};
