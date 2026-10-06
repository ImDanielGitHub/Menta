import { act, renderHook } from '@testing-library/react-native';
import { useGroupCooldownCheck } from '../useGroupCooldownCheck';
const mockCooldown = jest.fn();
jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'user' } }),
}));
jest.mock('@/store/group-store', () => ({
  useGroupStore: (select: (state: unknown) => unknown) =>
    select({ checkUserCooldown: mockCooldown }),
}));
jest.mock('@/lib/localization/use-translation', () => ({
  useTranslation: () => ({
    t: (key: never, values: never) =>
      require('@/lib/localization/translate').translate('en-NZ', key, values),
  }),
}));
it.each([1, 2])('includes the hour unit for %s remaining', async hours => {
  mockCooldown.mockResolvedValue({
    inCooldown: true,
    groupName: 'Walking friends',
    cooldownUntil: new Date(Date.now() + hours * 3600000 - 1000).toISOString(),
  });
  const notice = jest.fn();
  const { result } = renderHook(() =>
    useGroupCooldownCheck({ onCooldown: notice })
  );
  await act(async () => {
    await result.current();
  });
  expect(notice.mock.calls[0][0].message).toContain(
    `${hours} more hour${hours === 1 ? '' : 's'}`
  );
});
