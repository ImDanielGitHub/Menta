import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import {
  getMentaCheckOverview,
  getMentaCheckToday,
} from '@/lib/menta-check/api';

export function useMentaCheckOverview() {
  const owner = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ['menta-check', owner, 'overview'],
    queryFn: getMentaCheckOverview,
    enabled: Boolean(owner),
    staleTime: 15_000,
  });
}

export function useMentaCheckToday() {
  const owner = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ['menta-check', owner, 'today'],
    queryFn: getMentaCheckToday,
    enabled: Boolean(owner),
    refetchInterval: query =>
      query.state.data?.some(item => item.status === 'pending')
        ? 5_000
        : 30_000,
    refetchIntervalInBackground: false,
    staleTime: 3_000,
  });
}
