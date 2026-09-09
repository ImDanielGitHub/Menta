import { useEffect } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import {
  clearAllEventCapabilitiesForTests,
  holdEventCapability,
  peekEventCapability,
  type EventCapabilitySurface,
} from '@/lib/events/event-capability-holder';
import { useEventCapabilityHydration } from '@/lib/events/use-event-capability-hydration';
import { useProtectedRouteStore } from '@/store/protected-route-store';

const EVENT_A = '11111111-1111-4111-8111-111111111111';
const EVENT_B = '22222222-2222-4222-8222-222222222222';
const TOKEN_A = 'event_a_capability_token_1234567890';
const TOKEN_B = 'event_b_capability_token_1234567890';
const TOKEN_ACCOUNT_B = 'account_b_capability_token_1234567890';

type HarnessProps = {
  userId: string;
  eventId: string;
  surface: EventCapabilitySurface;
  inviteToken?: string;
};

describe.each(['detail', 'check-in', 'proof'] as const)(
  '%s event capability hydration',
  surface => {
    beforeEach(() => {
      clearAllEventCapabilitiesForTests();
      useProtectedRouteStore.setState({ pending: null });
    });

    it('scopes loads across event, account and explicit-token changes and scrubs the route once', async () => {
      const replace = jest.fn();
      const load = jest.fn();
      const useHarness = (props: HarnessProps) => {
        const hydration = useEventCapabilityHydration({
          ...props,
          explicitInviteToken: props.inviteToken,
          replace,
        });
        useEffect(() => {
          if (!hydration.ready) return;
          load({
            userId: props.userId,
            eventId: props.eventId,
            surface: props.surface,
            shareToken: hydration.shareToken ?? null,
            inviteToken: hydration.inviteToken ?? null,
          });
        }, [
          hydration.inviteToken,
          hydration.ready,
          hydration.shareToken,
          props.eventId,
          props.surface,
          props.userId,
        ]);
        return hydration;
      };

      const { rerender } = renderHook(useHarness, {
        initialProps: {
          userId: 'user-a',
          eventId: EVENT_A,
          surface,
          inviteToken: TOKEN_A,
        },
      });
      await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
      expect(load).toHaveBeenLastCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventId: EVENT_A,
          inviteToken: TOKEN_A,
        })
      );
      expect(JSON.stringify(replace.mock.calls)).not.toContain(TOKEN_A);
      expect(JSON.stringify(replace.mock.calls)).not.toContain('inviteToken');

      rerender({
        userId: 'user-a',
        eventId: EVENT_B,
        surface,
        inviteToken: TOKEN_B,
      });
      await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
      expect(load).toHaveBeenLastCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventId: EVENT_B,
          inviteToken: TOKEN_B,
        })
      );

      rerender({
        userId: 'user-b',
        eventId: EVENT_B,
        surface,
        inviteToken: TOKEN_ACCOUNT_B,
      });
      await waitFor(() => expect(load).toHaveBeenCalledTimes(3));
      expect(load).toHaveBeenLastCalledWith(
        expect.objectContaining({
          userId: 'user-b',
          eventId: EVENT_B,
          inviteToken: TOKEN_ACCOUNT_B,
        })
      );
      expect(load.mock.calls).not.toContainEqual([
        expect.objectContaining({
          userId: 'user-b',
          inviteToken: TOKEN_B,
        }),
      ]);

      rerender({
        userId: 'user-b',
        eventId: EVENT_B,
        surface,
      });
      await waitFor(() => expect(load).toHaveBeenCalledTimes(3));
      expect(
        peekEventCapability({
          ownerUserId: 'user-b',
          eventId: EVENT_B,
          surface,
        })?.token
      ).toBe(TOKEN_ACCOUNT_B);
    });

    it.each([
      {
        name: 'malformed explicit token',
        shareToken: undefined,
        inviteToken: 'short',
      },
      {
        name: 'conflicting explicit tokens',
        shareToken: TOKEN_B,
        inviteToken: TOKEN_ACCOUNT_B,
      },
    ])('fails closed for $name without using an older holder', async input => {
      const oldToken = 'older_held_capability_token_1234567890';
      holdEventCapability({
        ownerUserId: 'user-a',
        eventId: EVENT_A,
        surface,
        kind: 'invite',
        token: oldToken,
      });
      const replace = jest.fn();
      const load = jest.fn();
      const { result } = renderHook(() => {
        const hydration = useEventCapabilityHydration({
          userId: 'user-a',
          eventId: EVENT_A,
          surface,
          explicitShareToken: input.shareToken,
          explicitInviteToken: input.inviteToken,
          replace,
        });
        useEffect(() => {
          if (hydration.ready) load(hydration);
        }, [hydration]);
        return hydration;
      });

      await waitFor(() => expect(result.current.invalid).toBe(true));
      expect(result.current.ready).toBe(false);
      expect(load).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
      expect(
        peekEventCapability({
          ownerUserId: 'user-a',
          eventId: EVENT_A,
          surface,
        })?.token
      ).toBe(oldToken);
    });
  }
);

it('invalidates a mounted detail scope before hydrating the proof scope', async () => {
  clearAllEventCapabilitiesForTests();
  useProtectedRouteStore.setState({ pending: null });
  const replace = jest.fn();
  const load = jest.fn();
  const useHarness = (props: HarnessProps) => {
    const hydration = useEventCapabilityHydration({
      ...props,
      explicitInviteToken: props.inviteToken,
      replace,
    });
    useEffect(() => {
      if (hydration.ready) {
        load({ surface: props.surface, inviteToken: hydration.inviteToken });
      }
    }, [hydration.inviteToken, hydration.ready, props.surface]);
    return hydration;
  };
  const { rerender } = renderHook(useHarness, {
    initialProps: {
      userId: 'user-a',
      eventId: EVENT_A,
      surface: 'detail',
      inviteToken: TOKEN_A,
    },
  });
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));

  rerender({
    userId: 'user-a',
    eventId: EVENT_A,
    surface: 'proof',
    inviteToken: TOKEN_B,
  });
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  expect(load.mock.calls).toEqual([
    [{ surface: 'detail', inviteToken: TOKEN_A }],
    [{ surface: 'proof', inviteToken: TOKEN_B }],
  ]);
});
