import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useMentaMediaPermission } from '../use-menta-media-permission';

let mockOwner: string | undefined = 'account-a';
const mockRead = jest.fn();
jest.mock('@/store/auth-store', () => ({
  useAuthStore: Object.assign(
    (select: (state: unknown) => unknown) =>
      select({ user: mockOwner ? { id: mockOwner } : null }),
    { getState: () => ({ user: mockOwner ? { id: mockOwner } : null }) }
  ),
}));
jest.mock('@/lib/menta-check/api', () => ({
  getMentaCheckMediaPermissionV2: () => mockRead(),
}));
const deferred = () => {
  let resolve!: (value: unknown) => void;
  const promise = new Promise(value => {
    resolve = value;
  });
  return { promise, resolve };
};
beforeEach(() => {
  mockOwner = 'account-a';
  mockRead.mockReset();
});
it('shows loading before receipt readback and restores server permission on remount', async () => {
  const receipt = deferred();
  mockRead.mockReturnValueOnce(receipt.promise).mockResolvedValue('allowed');
  const first = renderHook(() => useMentaMediaPermission(true));
  expect(first.result.current.state).toBe('loading');
  await act(async () => receipt.resolve('allowed'));
  expect(first.result.current.state).toBe('allowed');
  first.unmount();
  const second = renderHook(() => useMentaMediaPermission(true));
  await waitFor(() => expect(second.result.current.state).toBe('allowed'));
  expect(mockRead).toHaveBeenCalledTimes(2);
});
it.each([null, {}, 'unavailable'])(
  'fails closed on unavailable readback %p',
  async data => {
    mockRead.mockResolvedValue(data);
    const view = renderHook(() => useMentaMediaPermission(true));
    await waitFor(() => expect(view.result.current.state).toBe('error'));
  }
);
it('allows retry after a transport failure without inventing acceptance', async () => {
  mockRead
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue('needs-review');
  const view = renderHook(() => useMentaMediaPermission(true));
  await waitFor(() => expect(view.result.current.state).toBe('error'));
  act(() => view.result.current.refresh());
  await waitFor(() => expect(view.result.current.state).toBe('needs-review'));
});
it('ignores a late receipt from the previous account', async () => {
  const old = deferred();
  mockRead.mockReturnValueOnce(old.promise).mockResolvedValue('needs-review');
  const view = renderHook(() => useMentaMediaPermission(true));
  mockOwner = 'account-b';
  view.rerender({});
  await waitFor(() => expect(view.result.current.state).toBe('needs-review'));
  await act(async () => old.resolve('allowed'));
  expect(view.result.current.state).toBe('needs-review');
});
it('ignores a late allowed response superseded by withdrawal refresh', async () => {
  const old = deferred();
  mockRead.mockReturnValueOnce(old.promise).mockResolvedValue('needs-review');
  const view = renderHook(() => useMentaMediaPermission(true));
  act(() => view.result.current.refresh());
  await waitFor(() => expect(view.result.current.state).toBe('needs-review'));
  await act(async () => old.resolve('allowed'));
  expect(view.result.current.state).toBe('needs-review');
});
it('reads anew after closing and ignores the previous visit response', async () => {
  const old = deferred();
  mockRead.mockReturnValueOnce(old.promise).mockResolvedValue('needs-review');
  const view = renderHook(({ visible }) => useMentaMediaPermission(visible), {
    initialProps: { visible: true },
  });
  view.rerender({ visible: false });
  await act(async () => old.resolve('allowed'));
  expect(view.result.current.state).toBe('loading');
  view.rerender({ visible: true });
  await waitFor(() => expect(view.result.current.state).toBe('needs-review'));
});
it('does not read without an authenticated owner or an open permission surface', () => {
  mockOwner = undefined;
  const view = renderHook(() => useMentaMediaPermission(true));
  expect(view.result.current.state).toBe('loading');
  view.unmount();
  mockOwner = 'account-a';
  renderHook(() => useMentaMediaPermission(false));
  expect(mockRead).not.toHaveBeenCalled();
});
it('ignores a response after unmount', async () => {
  const old = deferred();
  mockRead.mockReturnValue(old.promise);
  const view = renderHook(() => useMentaMediaPermission(true));
  view.unmount();
  await act(async () => old.resolve('allowed'));
  expect(view.result.current.state).toBe('loading');
});
