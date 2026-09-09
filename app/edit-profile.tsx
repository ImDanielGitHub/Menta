import { useTranslation } from '@/lib/localization';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { decode } from 'base64-arraybuffer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppButton,
  AppFieldRow,
  AppInlineNotice,
  AppScreen,
  AppTextField,
  AppTopBar,
  SkeletonLoader,
} from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { readFileBase64 } from '@/lib/filesystem';
import { PROFILE_SAFETY_DISCLOSURE } from '@/lib/content-safety';
import {
  getMyProfile,
  updateMyProfile,
  type MyProfile,
} from '@/lib/profile-api';
import { STORAGE_BUCKETS, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { trackProductOperation } from '@/lib/posthog';

import { backOrReplace } from '@/lib/navigation/safe-back';
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const PROFILE_AVATAR_PREVIEW_SIZE = 72;

type EditorState =
  | 'loading'
  | 'editing'
  | 'load-failed'
  | 'saving'
  | 'save-failed'
  | 'saved'
  | 'account-missing';

type PickerNotice = 'opening' | 'cancelled' | null;

type StagedPhoto = {
  uri: string;
  mimeType: string;
};

const isAccountRecoveryError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String(error.message)
        : '';

  return /AUTH_REQUIRED|AUTH_SESSION_REVOKED|PROFILE_NOT_FOUND/i.test(message);
};

const getDisplayName = (profile: MyProfile, fallback: string) =>
  profile.display_name?.trim() || profile.username?.trim() || fallback;

const SUPPORTED_PROFILE_PHOTO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const photoExtension = (mimeType: string) => {
  const extension = mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '');
  return extension || 'jpg';
};

const ProfileSkeleton = () => {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('fullAuth.edit_profile.loading_your_profile')}
      accessibilityRole="progressbar"
      style={styles.skeleton}
    >
      <SkeletonLoader announce={false} width={148} height={30} />
      <View style={styles.skeletonIdentity}>
        <SkeletonLoader announce={false} width={72} height={72} />
        <View style={styles.skeletonIdentityCopy}>
          <SkeletonLoader announce={false} width="64%" height={16} />
          <SkeletonLoader announce={false} width="42%" height={12} />
        </View>
      </View>
      {[0, 1, 2].map(index => (
        <SkeletonLoader key={index} announce={false} width="100%" height={64} />
      ))}
    </View>
  );
};

const ReadOnlyDetailRow = ({
  label,
  value,
  description,
  showDivider = true,
}: {
  label: string;
  value: string;
  description?: string;
  showDivider?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <View style={[styles.readOnlyRow, !showDivider && styles.lastDetailRow]}>
      <View style={styles.readOnlyLabelRow}>
        <Text style={styles.readOnlyLabel}>{label}</Text>
        <Text style={styles.readOnlyStatus}>
          {t('fullAuth.edit_profile.cannot_edit_here')}
        </Text>
      </View>
      <Text style={styles.readOnlyValue}>{value}</Text>
      {description ? (
        <Text style={styles.readOnlyDescription}>{description}</Text>
      ) : null}
    </View>
  );
};

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const phoneLayout = usePhoneLayout();
  const { isAuthenticated, logout, user } = useAuthStore();
  const [editorState, setEditorState] = useState<EditorState>('loading');
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [stagedPhoto, setStagedPhoto] = useState<StagedPhoto | null>(null);
  const [photoRemovalStaged, setPhotoRemovalStaged] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [pickerNotice, setPickerNotice] = useState<PickerNotice>(null);
  const requestRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const recoveryStartedForUserRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  currentUserIdRef.current = user?.id ?? null;

  const resetForMissingAccount = useCallback(() => {
    const accountId = currentUserIdRef.current;
    if (!accountId || recoveryStartedForUserRef.current === accountId) return;

    recoveryStartedForUserRef.current = accountId;
    requestRef.current += 1;
    saveInFlightRef.current = false;
    setProfile(null);
    setDisplayName('');
    setStagedPhoto(null);
    setPhotoRemovalStaged(false);
    setPickerNotice(null);
    setEditorState('account-missing');
    router.replace('/login');
    void logout().catch(() => undefined);
  }, [logout, router]);

  const loadProfile = useCallback(async () => {
    const requestId = ++requestRef.current;
    const accountId = user?.id ?? null;
    const accountUsername = user?.username ?? '';
    const isCurrentRequest = () =>
      requestId === requestRef.current &&
      currentUserIdRef.current === accountId;

    if (!accountId || !isAuthenticated) {
      if (isCurrentRequest()) {
        setProfile(null);
        setStagedPhoto(null);
        setPhotoRemovalStaged(false);
        setEditorState('account-missing');
      }
      return;
    }

    setProfile(null);
    setStagedPhoto(null);
    setPhotoRemovalStaged(false);
    setNameError(null);
    setPhotoError(null);
    setPickerNotice(null);
    setEditorState('loading');

    try {
      const nextProfile = await getMyProfile();
      if (!isCurrentRequest()) return;

      if (!nextProfile || nextProfile.id !== accountId) {
        resetForMissingAccount();
        return;
      }

      setProfile(nextProfile);
      setDisplayName(getDisplayName(nextProfile, accountUsername));
      setEditorState('editing');
    } catch (error) {
      if (!isCurrentRequest()) return;

      if (isAccountRecoveryError(error)) {
        resetForMissingAccount();
        return;
      }

      setEditorState('load-failed');
    }
  }, [isAuthenticated, resetForMissingAccount, user?.id, user?.username]);

  useEffect(() => {
    void loadProfile();
    return () => {
      requestRef.current += 1;
      saveInFlightRef.current = false;
    };
  }, [loadProfile]);

  const currentProfile = profile && profile.id === user?.id ? profile : null;
  const initialDisplayName = currentProfile
    ? getDisplayName(currentProfile, user?.username ?? '')
    : '';
  const isDirty = Boolean(
    currentProfile &&
    (displayName.trim() !== initialDisplayName ||
      stagedPhoto ||
      photoRemovalStaged)
  );
  const isSaving = editorState === 'saving';

  const updateEditingState = useCallback(() => {
    if (editorState === 'saved' || editorState === 'save-failed') {
      setEditorState('editing');
    }
  }, [editorState]);

  const handleDisplayNameChange = useCallback(
    (nextName: string) => {
      setDisplayName(nextName);
      setNameError(null);
      setPickerNotice(null);
      updateEditingState();
    },
    [updateEditingState]
  );

  const handleChoosePhoto = useCallback(async () => {
    if (!currentProfile || isSaving) return;

    const accountId = currentProfile.id;
    const isCurrentAccount = () => currentUserIdRef.current === accountId;
    setPhotoError(null);
    setPickerNotice('opening');

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!isCurrentAccount()) return;

      if (result.canceled || !result.assets?.length) {
        setPickerNotice('cancelled');
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      if (!SUPPORTED_PROFILE_PHOTO_MIME_TYPES.has(mimeType)) {
        setPickerNotice(null);
        setPhotoError(
          'Choose a JPEG, PNG, or WebP image for your profile photo.'
        );
        return;
      }
      if (asset.fileSize && asset.fileSize > MAX_PROFILE_PHOTO_BYTES) {
        setPickerNotice(null);
        setPhotoError('Choose a photo smaller than 5 MB.');
        return;
      }

      setStagedPhoto({ uri: asset.uri, mimeType });
      setPhotoRemovalStaged(false);
      setPickerNotice(null);
      updateEditingState();
    } catch {
      if (!isCurrentAccount()) return;
      setPickerNotice(null);
      setPhotoError('Menta could not open your photo library. Try again.');
    }
  }, [currentProfile, isSaving, updateEditingState]);

  const handleStagePhotoRemoval = useCallback(() => {
    if (!currentProfile || isSaving) return;

    setStagedPhoto(null);
    setPhotoRemovalStaged(true);
    setPhotoError(null);
    setPickerNotice(null);
    updateEditingState();
  }, [currentProfile, isSaving, updateEditingState]);

  const uploadStagedPhoto = useCallback(
    async (accountId: string, photo: StagedPhoto) => {
      const base64 = await readFileBase64(photo.uri);
      const fileData = decode(base64);
      if (
        fileData.byteLength <= 0 ||
        fileData.byteLength > MAX_PROFILE_PHOTO_BYTES
      ) {
        throw new Error('Choose a profile photo smaller than 5 MB.');
      }
      const objectKey = `${accountId}/avatar-${Date.now()}.${photoExtension(
        photo.mimeType
      )}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.PROFILE_PICTURES)
        .upload(objectKey, fileData, {
          contentType: photo.mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.PROFILE_PICTURES)
        .getPublicUrl(objectKey);
      if (!data.publicUrl) {
        throw new Error('PROFILE_PHOTO_URL_UNAVAILABLE');
      }

      return data.publicUrl;
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (
      !currentProfile ||
      !user?.id ||
      isSaving ||
      !isDirty ||
      saveInFlightRef.current
    ) {
      return;
    }

    const nextDisplayName = displayName.trim();
    if (nextDisplayName.length < 2) {
      setNameError('Use at least 2 characters.');
      setEditorState('editing');
      return;
    }
    if (nextDisplayName.length > 100) {
      setNameError('Use 100 characters or fewer.');
      setEditorState('editing');
      return;
    }

    saveInFlightRef.current = true;
    const accountId = user.id;
    const requestId = ++requestRef.current;
    const isCurrentRequest = () =>
      requestId === requestRef.current &&
      currentUserIdRef.current === accountId;

    setNameError(null);
    setPhotoError(null);
    setPickerNotice(null);
    setEditorState('saving');
    trackProductOperation({
      area: 'profile',
      authority: 'server',
      operation: 'update_profile',
      outcome: 'started',
      phase: 'intent',
      source: 'profile',
    });

    try {
      const avatarUrl = stagedPhoto
        ? await uploadStagedPhoto(accountId, stagedPhoto)
        : photoRemovalStaged
          ? null
          : currentProfile.avatar_url;
      if (!isCurrentRequest()) return;

      const updatedProfile = await updateMyProfile({
        display_name: nextDisplayName,
        avatar_url: avatarUrl,
      });
      if (!isCurrentRequest()) return;

      if (updatedProfile.id !== accountId) {
        trackProductOperation({
          area: 'profile',
          authority: 'server',
          operation: 'update_profile',
          outcome: 'blocked',
          phase: 'eligibility',
          source: 'profile',
        });
        resetForMissingAccount();
        return;
      }

      setProfile(updatedProfile);
      setDisplayName(getDisplayName(updatedProfile, user.username));
      setStagedPhoto(null);
      setPhotoRemovalStaged(false);
      setEditorState('saved');
      trackProductOperation({
        area: 'profile',
        authority: 'server',
        operation: 'update_profile',
        outcome: 'confirmed',
        phase: 'authority',
        source: 'profile',
      });
    } catch (error) {
      if (!isCurrentRequest()) return;

      if (isAccountRecoveryError(error)) {
        trackProductOperation({
          area: 'profile',
          authority: 'server',
          operation: 'update_profile',
          outcome: 'blocked',
          phase: 'eligibility',
          source: 'profile',
        });
        resetForMissingAccount();
        return;
      }

      trackProductOperation({
        area: 'profile',
        authority: 'server',
        operation: 'update_profile',
        outcome: 'unknown',
        phase: 'reconciliation',
        source: 'profile',
      });
      setEditorState('save-failed');
    } finally {
      saveInFlightRef.current = false;
    }
  }, [
    currentProfile,
    displayName,
    isDirty,
    isSaving,
    photoRemovalStaged,
    resetForMissingAccount,
    stagedPhoto,
    uploadStagedPhoto,
    user?.id,
    user?.username,
  ]);

  const photoSource = useMemo(() => {
    if (stagedPhoto) return { uri: stagedPhoto.uri };
    if (photoRemovalStaged || !currentProfile?.avatar_url) return undefined;
    return { uri: currentProfile.avatar_url };
  }, [currentProfile?.avatar_url, photoRemovalStaged, stagedPhoto]);

  if (editorState === 'account-missing' || !user) {
    return (
      <AppScreen
        lane="working"
        safeArea
        hasTabBar={false}
        scrollable
        contentContainerStyle={styles.screenContent}
      >
        <AppTopBar
          title={t('fullAuth.edit_profile.edit_profile')}
          onBack={() => router.replace('/login')}
        />
        <AppInlineNotice
          tone="error"
          title={t('fullAuth.edit_profile.account_required')}
          description={t(
            'fullAuth.edit_profile.sign_in_again_before_editing_this_profile'
          )}
        />
        <View style={styles.inlineAction}>
          <AppButton
            title={t('fullAuth.edit_profile.sign_in_again')}
            onPress={() => router.replace('/login')}
            fullWidth
            testID="edit-profile-sign-in"
          />
        </View>
      </AppScreen>
    );
  }

  if (editorState === 'loading') {
    return (
      <AppScreen
        lane="working"
        safeArea
        hasTabBar={false}
        scrollable
        contentContainerStyle={styles.screenContent}
      >
        <AppTopBar
          title={t('fullAuth.edit_profile.edit_profile')}
          onBack={() => backOrReplace(router, '/(tabs)/profile')}
        />
        <ProfileSkeleton />
      </AppScreen>
    );
  }

  if (editorState === 'load-failed') {
    return (
      <AppScreen
        lane="working"
        safeArea
        hasTabBar={false}
        scrollable
        contentContainerStyle={styles.screenContent}
      >
        <AppTopBar
          title={t('fullAuth.edit_profile.edit_profile')}
          onBack={() => backOrReplace(router, '/(tabs)/profile')}
        />
        <AppInlineNotice
          tone="error"
          title={t('fullAuth.edit_profile.profile_unavailable')}
          description={t(
            'fullAuth.edit_profile.no_changes_have_been_made_try_loading_your_accou'
          )}
        />
        <AppButton
          title={t('fullAuth.edit_profile.try_again')}
          variant="outline"
          onPress={() => void loadProfile()}
          fullWidth
          testID="edit-profile-retry-load"
        />
      </AppScreen>
    );
  }

  if (!currentProfile) {
    return (
      <AppScreen
        lane="working"
        safeArea
        hasTabBar={false}
        scrollable
        contentContainerStyle={styles.screenContent}
      >
        <AppTopBar
          title={t('fullAuth.edit_profile.edit_profile')}
          onBack={() => backOrReplace(router, '/(tabs)/profile')}
        />
        <AppInlineNotice
          tone="info"
          title={t('fullAuth.edit_profile.loading_your_profile')}
          description={t(
            'fullAuth.edit_profile.your_details_will_appear_when_this_check_finishe'
          )}
        />
      </AppScreen>
    );
  }

  if (editorState === 'saved') {
    return (
      <View style={styles.screenShell}>
        <AppScreen
          lane="working"
          safeArea
          hasTabBar={false}
          scrollable
          contentContainerStyle={styles.screenContent}
        >
          <AppTopBar
            title={t('fullAuth.edit_profile.edit_profile')}
            onBack={() => router.replace('/(tabs)/profile')}
          />
          <View style={styles.receiptContent}>
            <Text accessibilityRole="header" style={styles.receiptTitle}>
              {t('fullAuth.edit_profile.profile_updated')}
            </Text>
            <Text style={styles.receiptDescription}>
              {t(
                'fullAuth.edit_profile.your_saved_name_and_photo_now_appear_across_ment'
              )}
            </Text>
            <AppFieldRow
              title={getDisplayName(currentProfile, user.username)}
              subtitle={t('fullAuth.edit_profile.value', {
                value: currentProfile.username ?? user.username,
              })}
              trailing={
                <Avatar
                  size={48}
                  name={getDisplayName(currentProfile, user.username)}
                  source={
                    currentProfile.avatar_url
                      ? { uri: currentProfile.avatar_url }
                      : undefined
                  }
                />
              }
              showChevron={false}
              showDivider={false}
            />
          </View>
        </AppScreen>
        <View
          style={[
            styles.fixedFooter,
            {
              paddingBottom: insets.bottom + mentaSpacing[3],
              paddingHorizontal: phoneLayout.screenInset,
            },
          ]}
        >
          <View style={styles.fixedFooterLane}>
            <AppButton
              title={t('fullAuth.edit_profile.back_to_you')}
              onPress={() => router.replace('/(tabs)/profile')}
              fullWidth
              style={styles.primaryAction}
              testID="edit-profile-back-to-you"
            />
            <AppButton
              title={t('fullAuth.edit_profile.edit_again')}
              variant="ghost"
              onPress={() => setEditorState('editing')}
              fullWidth
              testID="edit-profile-edit-again"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screenShell}
    >
      <AppScreen
        lane="working"
        safeArea
        hasTabBar={false}
        scrollable
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.screenContent}
      >
        <AppTopBar
          title={t('fullAuth.edit_profile.edit_profile')}
          onBack={() => backOrReplace(router, '/(tabs)/profile')}
        />

        {editorState === 'saving' ? (
          <AppInlineNotice
            tone="info"
            title={t('fullAuth.edit_profile.saving_your_changes')}
            description={t(
              'fullAuth.edit_profile.you_can_keep_reviewing_the_preview_while_menta_s'
            )}
            testID="edit-profile-saving-notice"
          />
        ) : null}

        {editorState === 'save-failed' ? (
          <AppInlineNotice
            tone="error"
            title={t('fullAuth.edit_profile.your_edits_are_still_here')}
            description={t(
              'fullAuth.edit_profile.your_profile_has_not_changed_try_saving_again'
            )}
            testID="edit-profile-failed-notice"
          />
        ) : null}

        {pickerNotice === 'opening' ? (
          <AppInlineNotice
            tone="info"
            title={t('fullAuth.edit_profile.choose_a_profile_photo')}
            description={t(
              'fullAuth.edit_profile.nothing_changes_until_you_choose_one'
            )}
            testID="edit-profile-picker-handoff"
          />
        ) : null}

        {pickerNotice === 'cancelled' ? (
          <AppInlineNotice
            tone="info"
            title={t('fullAuth.edit_profile.no_photo_selected')}
            description={t(
              'fullAuth.edit_profile.your_profile_has_not_changed'
            )}
            testID="edit-profile-picker-cancelled"
          />
        ) : null}

        <View style={styles.identitySection}>
          <View style={styles.identityRow}>
            <Avatar
              size={PROFILE_AVATAR_PREVIEW_SIZE}
              name={displayName || currentProfile.username || user.username}
              source={photoSource}
            />
            <View style={styles.identityCopy}>
              <Text style={styles.identityName}>
                {displayName || currentProfile.username || user.username}
              </Text>
              <Text style={styles.identityUsername}>
                @{currentProfile.username ?? user.username}
              </Text>
            </View>
          </View>
          <View style={styles.profileActions}>
            <AppButton
              title={t('fullAuth.edit_profile.change_photo')}
              variant="outline"
              size="small"
              onPress={() => void handleChoosePhoto()}
              disabled={isSaving}
              testID="edit-profile-change-photo"
            />
            {(stagedPhoto || currentProfile.avatar_url) &&
            !photoRemovalStaged ? (
              <AppButton
                title={t('fullAuth.edit_profile.remove_photo')}
                variant="ghost"
                size="small"
                onPress={handleStagePhotoRemoval}
                disabled={isSaving}
                testID="edit-profile-remove-photo"
              />
            ) : null}
          </View>
        </View>

        <View style={styles.visibilitySection}>
          <Text style={styles.sectionLabel}>
            {t('fullAuth.edit_profile.photo_visibility')}
          </Text>
          <Text style={styles.visibilityCopy}>{PROFILE_SAFETY_DISCLOSURE}</Text>
        </View>

        {stagedPhoto ? (
          <View
            style={styles.previewSection}
            testID="edit-profile-local-preview"
          >
            <Text style={styles.previewTitle}>
              {t('fullAuth.edit_profile.how_it_will_look_on_you')}
            </Text>
            <View
              accessible
              accessibilityLabel={t(
                'fullAuth.edit_profile.selected_profile_photo_in_its_final_circular_cro'
              )}
              style={styles.finalAvatarPreview}
              testID="edit-profile-final-avatar-preview"
            >
              <Avatar
                size={PROFILE_AVATAR_PREVIEW_SIZE}
                name={displayName || currentProfile.username || user.username}
                source={{ uri: stagedPhoto.uri }}
              />
            </View>
            <AppInlineNotice
              tone="info"
              title={t('fullAuth.edit_profile.selected_not_saved')}
              description={t(
                'fullAuth.edit_profile.this_is_how_the_photo_will_look_on_you_it_will_n'
              )}
            />
          </View>
        ) : null}

        {photoRemovalStaged ? (
          <AppInlineNotice
            tone="warning"
            title={t('fullAuth.edit_profile.photo_will_be_removed')}
            description={t(
              'fullAuth.edit_profile.your_current_photo_stays_until_you_save_changes'
            )}
            testID="edit-profile-removal-staged"
          />
        ) : null}

        {photoError ? (
          <AppInlineNotice
            tone="error"
            title={t('fullAuth.edit_profile.choose_a_different_photo')}
            description={t(
              'fullAuth.edit_profile.photo_not_changed_photoerror',
              { photoError: photoError }
            )}
            testID="edit-profile-photo-rejected"
          />
        ) : null}

        <View style={styles.detailsSection}>
          <Text style={styles.sectionLabel}>
            {t('fullAuth.edit_profile.details')}
          </Text>
          <AppTextField
            label={t('fullAuth.edit_profile.name')}
            value={displayName}
            onChangeText={handleDisplayNameChange}
            autoCapitalize="words"
            maxLength={100}
            editable={!isSaving}
            errorText={nameError ?? undefined}
            testID="edit-profile-name"
            accessibilityLabel={t('fullAuth.edit_profile.display_name')}
          />
          <ReadOnlyDetailRow
            label={t('fullAuth.edit_profile.username')}
            value={`@${currentProfile.username ?? user.username}`}
            description={t(
              'fullAuth.edit_profile.usernames_can_t_be_changed_yet'
            )}
          />
          <ReadOnlyDetailRow
            label={t('fullAuth.edit_profile.email')}
            value={currentProfile.email ?? user.email ?? 'Unavailable'}
            description={t(
              'fullAuth.edit_profile.you_cannot_change_your_sign_in_email_here'
            )}
            showDivider={false}
          />
        </View>
      </AppScreen>

      <View
        style={[
          styles.fixedFooter,
          {
            paddingBottom: insets.bottom + mentaSpacing[3],
            paddingHorizontal: phoneLayout.screenInset,
          },
        ]}
      >
        <View style={styles.fixedFooterLane}>
          <AppButton
            title={
              isSaving
                ? t('fullAuth.edit_profile.saving_changes')
                : t('fullAuth.edit_profile.save_changes')
            }
            onPress={() => void handleSave()}
            disabled={!isDirty || isSaving}
            loading={isSaving}
            fullWidth
            style={styles.primaryAction}
            testID="edit-profile-save"
          />
          {editorState === 'save-failed' ? (
            <AppButton
              title={t('fullAuth.edit_profile.try_saving_again')}
              variant="ghost"
              onPress={() => void handleSave()}
              fullWidth
              testID="edit-profile-retry-save"
            />
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenShell: {
    flex: 1,
  },
  screenContent: {
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[8],
    paddingTop: mentaSpacing[6],
  },
  skeleton: {
    gap: mentaSpacing[5],
    paddingTop: mentaSpacing[5],
  },
  skeletonIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
  },
  skeletonIdentityCopy: {
    flex: 1,
    gap: mentaSpacing[2],
  },
  inlineAction: {
    marginTop: mentaSpacing[5],
  },
  identitySection: {
    gap: mentaSpacing[5],
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
  },
  identityCopy: {
    flex: 1,
    gap: mentaSpacing[1],
  },
  identityName: {
    color: mentaColors.text.primary,
    ...mentaTypography.title,
  },
  identityUsername: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  profileActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[2],
  },
  visibilitySection: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[1],
    paddingVertical: mentaSpacing[4],
  },
  sectionLabel: {
    color: mentaColors.text.secondary,
    ...mentaTypography.labelBold,
  },
  visibilityCopy: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  previewSection: {
    alignItems: 'flex-start',
    gap: mentaSpacing[3],
  },
  previewTitle: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmallMedium,
  },
  finalAvatarPreview: {
    borderRadius: PROFILE_AVATAR_PREVIEW_SIZE / 2,
    height: PROFILE_AVATAR_PREVIEW_SIZE,
    overflow: 'hidden',
    width: PROFILE_AVATAR_PREVIEW_SIZE,
  },
  detailsSection: {
    gap: mentaSpacing[4],
  },
  readOnlyRow: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[1],
    paddingVertical: mentaSpacing[3],
  },
  lastDetailRow: {
    borderBottomWidth: 0,
  },
  readOnlyLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readOnlyLabel: {
    color: mentaColors.text.secondary,
    ...mentaTypography.labelBold,
  },
  readOnlyStatus: {
    color: mentaColors.text.muted,
    ...mentaTypography.label,
  },
  readOnlyValue: {
    color: mentaColors.text.primary,
    ...mentaTypography.control,
  },
  readOnlyDescription: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  fixedFooter: {
    alignItems: 'center',
    backgroundColor: mentaColors.surface,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[3],
  },
  fixedFooterLane: {
    gap: mentaSpacing[2],
    maxWidth: mentaLayout.taskLane,
    width: '100%',
  },
  primaryAction: {
    minHeight: 52,
  },
  receiptContent: {
    gap: mentaSpacing[4],
    paddingTop: mentaSpacing[3],
  },
  receiptTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.journeyTitle,
  },
  receiptDescription: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
});
