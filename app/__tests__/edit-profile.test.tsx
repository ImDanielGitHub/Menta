import type { ReactNode } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import EditProfileScreen from '@/app/edit-profile';
import { readFileBase64 } from '@/lib/filesystem';
import { getMyProfile, updateMyProfile } from '@/lib/profile-api';

const mockUpload = jest.fn();

const mockRouter = {
  back: jest.fn(),
  replace: jest.fn(),
};

const mockAuthState: {
  isAuthenticated: boolean;
  logout: jest.Mock<Promise<void>, []>;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  } | null;
} = {
  isAuthenticated: true,
  logout: jest.fn<Promise<void>, []>(),
  user: {
    id: 'user-1',
    username: 'mia',
    email: 'mia@example.com',
  },
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockAuthState,
}));

jest.mock('@/lib/profile-api', () => ({
  getMyProfile: jest.fn(),
  updateMyProfile: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('base64-arraybuffer', () => ({ decode: jest.fn() }));

jest.mock('@/lib/filesystem', () => ({
  readFileBase64: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  STORAGE_BUCKETS: { PROFILE_PICTURES: 'profile-pictures' },
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: jest.fn(),
      })),
    },
  },
}));

jest.mock('@/components/ui', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text, TextInput, View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    AppScreen: ({ children }: { children: ReactNode }) =>
      React.createElement(View, null, children),
    AppTopBar: ({ title, onBack }: { title?: string; onBack?: () => void }) =>
      React.createElement(
        View,
        null,
        title ? React.createElement(Text, null, title) : null,
        onBack
          ? React.createElement(Pressable, {
              onPress: onBack,
              testID: 'edit-profile-back',
            })
          : null
      ),
    AppButton: ({
      title,
      onPress,
      disabled,
      testID,
    }: {
      title: string;
      onPress: () => void;
      disabled?: boolean;
      testID?: string;
    }) =>
      React.createElement(
        Pressable,
        { disabled, onPress, testID: testID ?? `button-${title}` },
        React.createElement(Text, null, title)
      ),
    AppTextField: ({
      value,
      onChangeText,
      testID,
      errorText,
      label,
    }: {
      value: string;
      onChangeText: (next: string) => void;
      testID?: string;
      errorText?: string;
      label?: string;
    }) =>
      React.createElement(
        View,
        null,
        label ? React.createElement(Text, null, label) : null,
        React.createElement(TextInput, { value, onChangeText, testID }),
        errorText ? React.createElement(Text, null, errorText) : null
      ),
    SkeletonLoader: () => React.createElement(View, null),
    AppFieldRow: ({
      title,
      subtitle,
      value,
      trailing,
    }: {
      title: string;
      subtitle?: string;
      value?: string;
      trailing?: ReactNode;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        subtitle ? React.createElement(Text, null, subtitle) : null,
        value ? React.createElement(Text, null, value) : null,
        trailing
      ),
    AppInlineNotice: ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        React.createElement(Text, null, description)
      ),
  };
});

jest.mock('@/components/ui/Avatar', () => ({
  Avatar: () => null,
}));

const mockedGetMyProfile = getMyProfile as jest.MockedFunction<
  typeof getMyProfile
>;
const mockedUpdateMyProfile = updateMyProfile as jest.MockedFunction<
  typeof updateMyProfile
>;
const mockedRequestPhotoPermission =
  ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockedLaunchImageLibrary =
  ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockedReadFileBase64 = readFileBase64 as jest.MockedFunction<
  typeof readFileBase64
>;

const profile = {
  id: 'user-1',
  email: 'mia@example.com',
  username: 'mia',
  display_name: 'Mia',
  avatar_url: 'https://cdn.example.com/mia.jpg',
  momenta_balance: 32,
  has_completed_onboarding: true,
  created_at: '2026-08-05T00:00:00.000Z',
  updated_at: '2026-08-05T00:00:00.000Z',
  is_pro: false,
  is_approved: true,
};

describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.user = {
      id: 'user-1',
      username: 'mia',
      email: 'mia@example.com',
    };
    mockAuthState.isAuthenticated = true;
    mockAuthState.logout.mockResolvedValue(undefined);
    mockedGetMyProfile.mockResolvedValue(profile);
    mockedUpdateMyProfile.mockResolvedValue(profile);
  });

  const renderLoadedScreen = async () => {
    render(<EditProfileScreen />);
    await waitFor(() =>
      expect(screen.getByTestId('edit-profile-name')).toBeTruthy()
    );
  };

  const choosePhoto = async (asset: {
    uri: string;
    mimeType?: string | null;
    fileSize?: number | null;
  }) => {
    mockedLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [asset],
    });
    await renderLoadedScreen();
    fireEvent.press(screen.getByTestId('edit-profile-change-photo'));
  };

  it('shows the canonical loading skeleton before current account details arrive', () => {
    let resolveProfile: (value: typeof profile) => void;
    mockedGetMyProfile.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveProfile = resolve;
        })
    );

    render(<EditProfileScreen />);

    expect(screen.getByLabelText('Loading your profile')).toBeTruthy();
    resolveProfile!(profile);
  });

  it('renders only the current account profile, with username and email read only', async () => {
    render(<EditProfileScreen />);

    await waitFor(() => expect(screen.getByText('Mia')).toBeTruthy());

    expect(screen.getAllByText('@mia')).toHaveLength(2);
    expect(screen.getByText("Usernames can't be changed yet.")).toBeTruthy();
    expect(screen.getByText('mia@example.com')).toBeTruthy();
  });

  it('keeps an invalid display name local and does not send an update', async () => {
    await renderLoadedScreen();
    fireEvent.changeText(screen.getByTestId('edit-profile-name'), 'A');
    fireEvent.press(screen.getByTestId('edit-profile-save'));

    expect(screen.queryByText('Check this name before saving.')).toBeNull();
    expect(screen.getByText('Use at least 2 characters.')).toBeTruthy();
    expect(mockedUpdateMyProfile).not.toHaveBeenCalled();
  });

  it('preserves staged edits after a failed server save and offers a retry', async () => {
    mockedUpdateMyProfile.mockRejectedValueOnce(new Error('NETWORK_FAILED'));
    await renderLoadedScreen();
    fireEvent.changeText(screen.getByTestId('edit-profile-name'), 'Mia Parker');
    fireEvent.press(screen.getByTestId('edit-profile-save'));

    await waitFor(() =>
      expect(screen.getByText('Your edits are still here')).toBeTruthy()
    );
    expect(screen.getByTestId('edit-profile-name').props.value).toBe(
      'Mia Parker'
    );
    expect(screen.getByTestId('edit-profile-retry-save')).toBeTruthy();
  });

  it('clears the local account route when the server profile belongs to another user', async () => {
    mockedGetMyProfile.mockResolvedValueOnce({
      ...profile,
      id: 'user-2',
      display_name: 'Another person',
    });

    render(<EditProfileScreen />);

    await waitFor(() => {
      expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByText('Another person')).toBeNull();
  });

  it('rejects unsupported image types before reading, uploading, or saving', async () => {
    await choosePhoto({
      uri: 'file:///profile.heic',
      mimeType: 'image/heic',
      fileSize: 1200,
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          /Choose a JPEG, PNG, or WebP image for your profile photo\./
        )
      ).toBeTruthy()
    );
    expect(mockedReadFileBase64).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockedUpdateMyProfile).not.toHaveBeenCalled();
  });

  it('rejects photos over the server limit before staging or uploading', async () => {
    await choosePhoto({
      uri: 'file:///oversized-profile.jpg',
      mimeType: 'image/jpeg',
      fileSize: 5 * 1024 * 1024 + 1,
    });

    await waitFor(() =>
      expect(
        screen.getByText(/Choose a photo smaller than 5 MB\./)
      ).toBeTruthy()
    );
    expect(screen.queryByTestId('edit-profile-local-preview')).toBeNull();
    expect(mockedReadFileBase64).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockedUpdateMyProfile).not.toHaveBeenCalled();
  });

  it('returns from a cancelled picker with the existing edit unchanged', async () => {
    mockedLaunchImageLibrary.mockResolvedValue({
      canceled: true,
      assets: null,
    });
    await renderLoadedScreen();

    fireEvent.press(screen.getByTestId('edit-profile-change-photo'));

    await waitFor(() =>
      expect(screen.getByText('No photo selected')).toBeTruthy()
    );
    expect(screen.queryByTestId('edit-profile-local-preview')).toBeNull();
    expect(mockedRequestPhotoPermission).not.toHaveBeenCalled();
    expect(mockedLaunchImageLibrary).toHaveBeenCalledTimes(1);
    expect(mockedUpdateMyProfile).not.toHaveBeenCalled();
  });

  it('keeps a selected photo local until the save receipt arrives', async () => {
    await choosePhoto({
      uri: 'file:///profile.png',
      mimeType: 'image/png',
      fileSize: 1200,
    });

    await waitFor(() =>
      expect(screen.getByTestId('edit-profile-local-preview')).toBeTruthy()
    );
    expect(screen.getByText('Selected, not saved')).toBeTruthy();
    expect(
      screen.getByText(
        'This is how the photo will look on You. It will not change until you save.'
      )
    ).toBeTruthy();
    const previewStyle = StyleSheet.flatten(
      screen.getByTestId('edit-profile-final-avatar-preview').props.style
    );
    expect(previewStyle).toMatchObject({
      borderRadius: 36,
      height: 72,
      overflow: 'hidden',
      width: 72,
    });
    expect(mockedReadFileBase64).not.toHaveBeenCalled();
    expect(mockedUpdateMyProfile).not.toHaveBeenCalled();
  });

  it('shows the picker handoff copy while the native picker is unresolved', async () => {
    let resolvePicker: (value: { canceled: true; assets: null }) => void;
    mockedLaunchImageLibrary.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolvePicker = resolve;
        })
    );
    await renderLoadedScreen();

    fireEvent.press(screen.getByTestId('edit-profile-change-photo'));

    await waitFor(() =>
      expect(screen.getByText('Choose a profile photo')).toBeTruthy()
    );
    expect(
      screen.getByText('Nothing changes until you choose one.')
    ).toBeTruthy();
    resolvePicker!({ canceled: true, assets: null });
  });

  it('stages photo removal without mutating the account profile', async () => {
    await renderLoadedScreen();

    fireEvent.press(screen.getByTestId('edit-profile-remove-photo'));

    expect(screen.getByText('Photo will be removed')).toBeTruthy();
    expect(mockedUpdateMyProfile).not.toHaveBeenCalled();
  });

  it('blocks a duplicate save and retains the local preview while saving', async () => {
    let resolveUpdate: (value: typeof profile) => void;
    mockedUpdateMyProfile.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveUpdate = resolve;
        })
    );
    await renderLoadedScreen();
    fireEvent.changeText(screen.getByTestId('edit-profile-name'), 'Mia Parker');

    fireEvent.press(screen.getByTestId('edit-profile-save'));
    fireEvent.press(screen.getByTestId('edit-profile-save'));

    await waitFor(() =>
      expect(screen.getByText('Saving your changes')).toBeTruthy()
    );
    expect(mockedUpdateMyProfile).toHaveBeenCalledTimes(1);
    resolveUpdate!({ ...profile, display_name: 'Mia Parker' });
  });

  it('shows the server-confirmed receipt only after the current profile returns', async () => {
    mockedUpdateMyProfile.mockResolvedValueOnce({
      ...profile,
      display_name: 'Mia Parker',
    });
    await renderLoadedScreen();
    fireEvent.changeText(screen.getByTestId('edit-profile-name'), 'Mia Parker');
    fireEvent.press(screen.getByTestId('edit-profile-save'));

    await waitFor(() =>
      expect(screen.getByText('Profile updated')).toBeTruthy()
    );
    expect(screen.getAllByText('Profile updated')).toHaveLength(1);
    expect(
      screen.getByText('Your saved name and photo now appear across Menta.')
    ).toBeTruthy();
    expect(screen.queryByTestId('edit-profile-saved-receipt')).toBeNull();
  });

  it('never applies a picker result after the authenticated account changes', async () => {
    let resolvePicker: (value: {
      canceled: false;
      assets: Array<{ uri: string; mimeType: string; fileSize: number }>;
    }) => void;
    mockedLaunchImageLibrary.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolvePicker = resolve;
        })
    );
    const view = render(<EditProfileScreen />);
    await waitFor(() =>
      expect(screen.getByTestId('edit-profile-change-photo')).toBeTruthy()
    );
    fireEvent.press(screen.getByTestId('edit-profile-change-photo'));
    await waitFor(() => expect(mockedLaunchImageLibrary).toHaveBeenCalled());

    mockAuthState.user = {
      id: 'user-2',
      username: 'other',
      email: 'other@example.com',
    };
    mockedGetMyProfile.mockResolvedValueOnce({
      ...profile,
      id: 'user-2',
      username: 'other',
      display_name: 'Other',
    });
    view.rerender(<EditProfileScreen />);
    resolvePicker!({
      canceled: false,
      assets: [
        {
          uri: 'file:///previous-account.jpg',
          mimeType: 'image/jpeg',
          fileSize: 42,
        },
      ],
    });

    await waitFor(() => expect(screen.getByText('Other')).toBeTruthy());
    expect(screen.queryByTestId('edit-profile-local-preview')).toBeNull();
  });
});
