/* eslint-disable no-undef, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

import 'react-native-gesture-handler/jestSetup';

// SDK 56 @expo/ui stores SwiftUI and Compose field values in a native
// ObservableState. jest-expo installs the global Expo module registry, but the
// package does not ship a native-module mock for ExpoUI yet. Keep the mock at
// the native boundary so route tests exercise the real AppFields wrapper.
class MockExpoUIObservableState {
  constructor({ value }) {
    this.currentValue = value;
    this.onChange = null;
  }

  getValue() {
    return this.currentValue;
  }

  setValue({ value }) {
    this.currentValue = value;
    this.onChange?.(value);
  }

  setOnChange(callback) {
    this.onChange = callback;
  }

  release() {}
}

globalThis.expo.modules.ExpoUI = {
  ...(globalThis.expo.modules.ExpoUI ?? {}),
  ObservableState: MockExpoUIObservableState,
  WorkletCallback: class MockExpoUIWorkletCallback {
    constructor(callback) {
      this.callback = callback;
    }
  },
};

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const ReactNative = require('react-native');
  const immediate = value => value;

  return {
    __esModule: true,
    default: {
      createAnimatedComponent: component => component,
      Image: ReactNative.Image,
      ScrollView: ReactNative.ScrollView,
      Text: ReactNative.Text,
      View: ReactNative.View,
      call: () => {},
    },
    cancelAnimation: () => {},
    Easing: ReactNative.Easing,
    runOnJS: callback => callback,
    useAnimatedReaction: () => {},
    useAnimatedProps: factory => factory(),
    useAnimatedStyle: factory => factory(),
    useFrameCallback: () => ({
      callbackId: 1,
      isActive: false,
      setActive: () => {},
    }),
    useSharedValue: value => ({ value }),
    withDelay: (_delay, value) => value,
    withRepeat: value => value,
    withTiming: immediate,
  };
});

jest.mock('@amplitude/analytics-react-native', () => ({
  add: jest.fn(() => ({ promise: Promise.resolve() })),
  init: jest.fn(() => ({ promise: Promise.resolve() })),
  reset: jest.fn(),
  setUserId: jest.fn(),
  track: jest.fn(),
}));

jest.mock('@amplitude/plugin-session-replay-react-native', () => ({
  SessionReplayPlugin: jest.fn(),
}));

// PostHog mock: keep native replay/plugin out of Jest.
jest.mock('posthog-react-native', () => {
  const client = {
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    getFeatureFlag: jest.fn(() => undefined),
    onFeatureFlags: jest.fn(() => () => undefined),
    startSessionRecording: jest.fn(async () => undefined),
    stopSessionRecording: jest.fn(async () => undefined),
  };
  return {
    __esModule: true,
    default: jest.fn(() => client),
    PostHog: jest.fn(() => client),
    PostHogProvider: ({ children }) => children,
    usePostHog: () => client,
    useFeatureFlag: jest.fn(() => undefined),
  };
});

jest.mock('@posthog/react-native-plugin', () => ({}));

jest.mock('react-native-fbsdk-next', () => ({
  AppEventsLogger: {
    logEvent: jest.fn(),
  },
  Settings: {
    initializeSDK: jest.fn(),
    setAdvertiserIDCollectionEnabled: jest.fn(),
    setAdvertiserTrackingEnabled: jest.fn(async () => true),
    setAppID: jest.fn(),
    setAutoLogAppEventsEnabled: jest.fn(),
    setClientToken: jest.fn(),
  },
}));

jest.mock('expo-tracking-transparency', () => ({
  getTrackingPermissionsAsync: jest.fn(async () => ({
    status: 'undetermined',
  })),
  requestTrackingPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
  })),
}));

// Sentry mock: keep light to avoid native init during tests
jest.mock('@sentry/react-native', () => {
  const api = {
    init: jest.fn(),
    setUser: jest.fn(),
    setTag: jest.fn(),
    setContext: jest.fn(),
    addBreadcrumb: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    logger: {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
    },
    withScope: cb =>
      cb({ setTag: jest.fn(), setContext: jest.fn(), setExtra: jest.fn() }),
    startSpan: jest.fn(async (_ctx, cb) => cb()),
    feedbackIntegration: jest.fn(() => ({})),
    mobileReplayIntegration: jest.fn(() => ({})),
    getClient: jest.fn(() => ({
      getOptions: () => ({
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
      }),
    })),
    wrap: Comp => Comp,
  };
  return api;
});

// Mock Google SignIn
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      user: {
        id: 'google-user-id',
        email: 'test@gmail.com',
        name: 'Test User',
      },
    }),
    signOut: jest.fn().mockResolvedValue(null),
    isSignedIn: jest.fn().mockResolvedValue(false),
    getCurrentUser: jest.fn().mockResolvedValue(null),
  },
}));

// Mock Apple Authentication
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn().mockResolvedValue({
    user: 'apple-user-id',
    email: 'test@icloud.com',
    fullName: { givenName: 'Test', familyName: 'User' },
    identityToken: 'mock-token',
  }),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  AppleAuthenticationButton: ({ children, ...props }) => children,
  AppleAuthenticationButtonType: {
    SIGN_IN: 'SIGN_IN',
    SIGN_UP: 'SIGN_UP',
  },
  AppleAuthenticationButtonStyle: {
    WHITE: 'WHITE',
    BLACK: 'BLACK',
  },
}));

// Mock Expo Crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('mock-digest'),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  performAndroidHapticsAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Soft: 'soft',
    Rigid: 'rigid',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  AndroidHaptics: {
    Confirm: 'confirm',
    Reject: 'reject',
    Keyboard_Tap: 'keyboard-tap',
    Segment_Tick: 'segment-tick',
    Segment_Frequent_Tick: 'segment-frequent-tick',
    Drag_Start: 'drag-start',
    Long_Press: 'long-press',
    Context_Click: 'context-click',
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key',
    },
  },
}));

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }) => (
      <View {...props} testID="linear-gradient">
        {children}
      </View>
    ),
  };
});

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    VideoView: ({ children, ...props }) => (
      <View {...props} testID="expo-video-view">
        {children}
      </View>
    ),
    useVideoPlayer: jest.fn(() => ({
      play: jest.fn(),
      pause: jest.fn(),
      loop: false,
    })),
  };
});

// Mock @react-native-async-storage/async-storage with in-memory persistence.
// Zustand persist tests need real read-after-write behavior, not no-op storage.
const mockAsyncStorage = new Map();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(key => Promise.resolve(mockAsyncStorage.get(key) ?? null)),
  setItem: jest.fn((key, value) => {
    mockAsyncStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn(key => {
    mockAsyncStorage.delete(key);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockAsyncStorage.clear();
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() =>
    Promise.resolve(Array.from(mockAsyncStorage.keys()))
  ),
  multiGet: jest.fn(keys =>
    Promise.resolve(keys.map(key => [key, mockAsyncStorage.get(key) ?? null]))
  ),
  multiSet: jest.fn(entries => {
    entries.forEach(([key, value]) => mockAsyncStorage.set(key, value));
    return Promise.resolve();
  }),
  multiRemove: jest.fn(keys => {
    keys.forEach(key => mockAsyncStorage.delete(key));
    return Promise.resolve();
  }),
}));

// Mock Expo Image Picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
  ImagePickerResult: {},
}));

// Global test setup
global.__DEV__ = true;
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = require('url').URLSearchParams;
}

// Completely suppress React warnings during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  log: jest.fn(),
  error: jest.fn(), // Suppress all console.error during tests
};

// Mock Supabase
const mockSupabaseResponse = {
  data: null,
  error: null,
  status: 200,
  statusText: 'OK',
};

const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  containedBy: jest.fn().mockReturnThis(),
  rangeGt: jest.fn().mockReturnThis(),
  rangeLt: jest.fn().mockReturnThis(),
  rangeGte: jest.fn().mockReturnThis(),
  rangeLte: jest.fn().mockReturnThis(),
  rangeAdjacent: jest.fn().mockReturnThis(),
  overlaps: jest.fn().mockReturnThis(),
  textSearch: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(mockSupabaseResponse),
  maybeSingle: jest.fn().mockResolvedValue(mockSupabaseResponse),
  then: jest.fn().mockResolvedValue(mockSupabaseResponse),
};

jest.mock('@/lib/supabase', () => ({
  passwordRecoverySupabase: {
    auth: {
      exchangeCodeForSession: jest.fn().mockResolvedValue(mockSupabaseResponse),
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: null }, error: null }),
      resetPasswordForEmail: jest.fn().mockResolvedValue(mockSupabaseResponse),
      signOut: jest.fn().mockResolvedValue(mockSupabaseResponse),
      updateUser: jest.fn().mockResolvedValue(mockSupabaseResponse),
    },
  },
  supabase: {
    from: jest.fn(() => mockSupabaseQuery),
    rpc: jest.fn().mockResolvedValue(mockSupabaseResponse),
    functions: {
      invoke: jest.fn().mockResolvedValue(mockSupabaseResponse),
    },
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue(mockSupabaseResponse),
      signUp: jest.fn().mockResolvedValue(mockSupabaseResponse),
      signOut: jest.fn().mockResolvedValue(mockSupabaseResponse),
      refreshSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      updateUser: jest.fn().mockResolvedValue(mockSupabaseResponse),
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue(mockSupabaseResponse),
        download: jest.fn().mockResolvedValue(mockSupabaseResponse),
        remove: jest.fn().mockResolvedValue(mockSupabaseResponse),
        list: jest.fn().mockResolvedValue(mockSupabaseResponse),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/file.jpg' },
        }),
      })),
    },
  },
}));

// Mock lib modules
jest.mock('@/lib/network', () => ({
  handleNetworkError: jest.fn(),
  withRetry: jest.fn(fn => fn()),
}));

jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
  captureMessage: jest.fn(),
  logError: jest.fn(),
  recordProductAnalyticsEvent: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);
