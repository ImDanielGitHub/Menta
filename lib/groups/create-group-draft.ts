import {
  DEFAULT_GROUP_IMAGE_PRESET,
  isGroupImagePresetKey,
  type GroupImagePresetKey,
} from './group-image-presets';

export type CreateGroupDraft = {
  version: 1;
  groupName: string;
  privacy: 'public' | 'private';
  memberNudges: boolean;
  imagePreset: GroupImagePresetKey;
};

const CREATE_GROUP_DRAFT_PREFIX = 'menta.create-group-draft.v1';

export const getCreateGroupDraftKey = (userId: string): string =>
  `${CREATE_GROUP_DRAFT_PREFIX}:${userId}`;

export const decodeCreateGroupDraft = (
  raw: string | null
): CreateGroupDraft | null => {
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;

    const candidate = value as Record<string, unknown>;
    if (
      candidate.version !== 1 ||
      typeof candidate.groupName !== 'string' ||
      candidate.groupName.length > 80 ||
      (candidate.privacy !== 'public' && candidate.privacy !== 'private') ||
      typeof candidate.memberNudges !== 'boolean' ||
      (candidate.imagePreset !== undefined &&
        !isGroupImagePresetKey(candidate.imagePreset))
    ) {
      return null;
    }

    return {
      version: 1,
      groupName: candidate.groupName,
      privacy: candidate.privacy,
      memberNudges: candidate.memberNudges,
      imagePreset:
        candidate.imagePreset === undefined
          ? DEFAULT_GROUP_IMAGE_PRESET
          : candidate.imagePreset,
    };
  } catch {
    return null;
  }
};
