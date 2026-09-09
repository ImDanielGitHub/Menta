import type { ImageSourcePropType } from 'react-native';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';

export const GROUP_IMAGE_PRESET_PREFIX = 'menta-preset:';

export const GROUP_IMAGE_PRESETS = [
  {
    key: 'move',
    labelKey: 'groups.create.walking',
    descriptionKey: 'groups.source.image_move_description',
    get label() {
      return translate('en-NZ', 'groups.create.image_move_label');
    },
    get description() {
      return translate('en-NZ', 'groups.source.image_move_description');
    },
    source: require('../../assets/images/group-presets/move.png'),
  },
  {
    key: 'focus',
    labelKey: 'groups.create.study',
    descriptionKey: 'groups.source.image_focus_description',
    get label() {
      return translate('en-NZ', 'groups.create.image_focus_label');
    },
    get description() {
      return translate('en-NZ', 'groups.source.image_focus_description');
    },
    source: require('../../assets/images/group-presets/focus.png'),
  },
  {
    key: 'reset',
    labelKey: 'groups.create.reset',
    descriptionKey: 'groups.source.image_reset_description',
    get label() {
      return translate('en-NZ', 'groups.create.image_reset_label');
    },
    get description() {
      return translate('en-NZ', 'groups.source.image_reset_description');
    },
    source: require('../../assets/images/group-presets/reset.png'),
  },
  {
    key: 'create',
    labelKey: 'groups.create.creative',
    descriptionKey: 'groups.source.image_create_description',
    get label() {
      return translate('en-NZ', 'groups.create.image_create_label');
    },
    get description() {
      return translate('en-NZ', 'groups.source.image_create_description');
    },
    source: require('../../assets/images/group-presets/create.png'),
  },
] as const satisfies readonly {
  key: string;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  readonly label: string;
  readonly description: string;
  source: ImageSourcePropType;
}[];

export type GroupImagePresetKey = (typeof GROUP_IMAGE_PRESETS)[number]['key'];

export const DEFAULT_GROUP_IMAGE_PRESET: GroupImagePresetKey = 'move';

export const isGroupImagePresetKey = (
  value: unknown
): value is GroupImagePresetKey =>
  typeof value === 'string' &&
  GROUP_IMAGE_PRESETS.some(preset => preset.key === value);

export const getGroupImagePreset = (key: GroupImagePresetKey) =>
  GROUP_IMAGE_PRESETS.find(preset => preset.key === key) ??
  GROUP_IMAGE_PRESETS[0];

export const getGroupImagePresetToken = (key: GroupImagePresetKey): string =>
  `${GROUP_IMAGE_PRESET_PREFIX}${key}`;

export const resolveGroupImagePreset = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed?.startsWith(GROUP_IMAGE_PRESET_PREFIX)) return null;

  const key = trimmed.slice(GROUP_IMAGE_PRESET_PREFIX.length);
  return isGroupImagePresetKey(key) ? getGroupImagePreset(key) : null;
};
