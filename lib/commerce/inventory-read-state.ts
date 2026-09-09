/**
 * Keeps an empty inventory distinct from an inventory whose ownership record
 * could not be read. The latter must never be presented as a confirmed zero.
 */
export type InventoryReadState =
  | 'loading'
  | 'unavailable'
  | 'empty'
  | 'filtered-empty'
  | 'ready';

export function isCurrentInventoryAccount(
  requestedUserId: string | null,
  currentUserId: string | null
): boolean {
  return Boolean(requestedUserId && requestedUserId === currentUserId);
}

export function getInventoryReadState({
  loading,
  hasConfirmedSnapshot,
  loadError,
  itemCount,
  visibleItemCount,
}: {
  loading: boolean;
  hasConfirmedSnapshot: boolean;
  loadError: string | null;
  itemCount: number;
  visibleItemCount: number;
}): InventoryReadState {
  if (loading) return 'loading';

  // A server read is the only authority that can establish an empty kit. A
  // failed first read (or a read with no confirmed snapshot) is unknown, even
  // when stale Zustand data happens to contain no items.
  if (loadError || !hasConfirmedSnapshot) return 'unavailable';
  if (itemCount === 0) return 'empty';
  if (visibleItemCount === 0) return 'filtered-empty';
  return 'ready';
}
