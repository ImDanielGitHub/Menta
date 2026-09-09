import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EventDetailScreen from '@/app/events/[eventId]';
import EventCheckInScreen from '@/app/events/[eventId]/check-in';
import EventProofScreen from '@/app/events/[eventId]/proof';
import {
  clearAllEventCapabilitiesForTests,
  holdEventCapability,
  peekEventCapability,
  type EventCapabilitySurface,
} from '@/lib/events/event-capability-holder';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const OLD_TOKEN = 'older_held_capability_token_1234567890';
const SHARE_TOKEN = 'new_share_capability_token_1234567890';
const INVITE_TOKEN = 'new_invite_capability_token_1234567890';
const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockLoadSummary = jest.fn();
const mockLoadMyOccurrence = jest.fn();
let mockParams: {
  eventId: string;
  shareToken?: string;
  inviteToken?: string;
} = { eventId: EVENT_ID };

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockParams,
  useRouter: () => mockRouter,
}));

jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: false }, jest.fn()],
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@/lib/events/upload-queue', () => ({
  listEventUploadQueue: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { id: 'user-a' } }),
}));

jest.mock('@/store/event-store', () => ({
  useEventStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      summary: null,
      myOccurrence: null,
      loading: false,
      error: null,
      loadSummary: mockLoadSummary,
      loadMyOccurrence: mockLoadMyOccurrence,
      loadOrganiserReviewQueue: jest.fn(),
      joinEvent: jest.fn(),
      checkIn: jest.fn(),
      submitPost: jest.fn(),
      resumePost: jest.fn(),
    }),
}));

const routes: Array<{
  name: string;
  surface: EventCapabilitySurface;
  Screen: React.ComponentType;
}> = [
  { name: 'detail', surface: 'detail', Screen: EventDetailScreen },
  { name: 'check-in', surface: 'check-in', Screen: EventCheckInScreen },
  { name: 'proof', surface: 'proof', Screen: EventProofScreen },
];

const invalidInputs = [
  {
    name: 'malformed explicit token',
    params: { eventId: EVENT_ID, inviteToken: 'short' },
  },
  {
    name: 'conflicting explicit tokens',
    params: {
      eventId: EVENT_ID,
      shareToken: SHARE_TOKEN,
      inviteToken: INVITE_TOKEN,
    },
  },
];

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    }}
  >
    {children}
  </SafeAreaProvider>
);

describe.each(routes)('$name invalid capability recovery', route => {
  afterEach(() => cleanup());

  it.each(invalidInputs)(
    'fails closed for $name without using the older holder',
    async input => {
      jest.clearAllMocks();
      clearAllEventCapabilitiesForTests();
      mockParams = input.params;
      holdEventCapability({
        ownerUserId: 'user-a',
        eventId: EVENT_ID,
        surface: route.surface,
        kind: 'invite',
        token: OLD_TOKEN,
      });

      render(<route.Screen />, { wrapper: Wrapper });

      expect(
        await screen.findByText('This event link is invalid.')
      ).toBeTruthy();
      expect(
        screen.getByText('Open a current event link. Nothing has changed.')
      ).toBeTruthy();
      await waitFor(() => expect(mockLoadSummary).not.toHaveBeenCalled());
      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(
        peekEventCapability({
          ownerUserId: 'user-a',
          eventId: EVENT_ID,
          surface: route.surface,
        })?.token
      ).toBe(OLD_TOKEN);
    }
  );
});
