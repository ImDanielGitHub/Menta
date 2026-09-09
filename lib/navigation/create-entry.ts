import type { ChallengeMode } from '@/lib/challenge-mode';
import type { CommitmentTemplateId } from '@/lib/commitments/templates';
import type { Href } from 'expo-router';

export type CreateEntrySource =
  | 'create_tab'
  | 'home_plus'
  | 'home_quick_action'
  | 'group_detail'
  | 'onboarding'
  | 'solo_screen'
  | 'profile'
  | 'groups_tab';

export type CreationIntent =
  | 'create_group'
  | 'create_group_challenge'
  | 'create_solo_challenge';

type RouterLike = {
  push: (href: Href) => void;
};

type OpenCreateBaseOptions = {
  router: RouterLike;
  source: CreateEntrySource;
};

type OpenCreateWithTemplateOptions = OpenCreateBaseOptions & {
  templateId?: CommitmentTemplateId;
  title?: string;
  verificationType?: string;
  reminderTime?: string;
};

type OpenCreateGroupOptions = OpenCreateWithTemplateOptions & {
  checkGroupCooldown?: () => Promise<boolean>;
};

type OpenCreateGroupChallengeOptions = OpenCreateWithTemplateOptions & {
  groupId?: string | null;
};

type OpenCreateHubOptions = OpenCreateBaseOptions & {
  intent?: CreationIntent;
};

type CreateChallengeHrefOptions = {
  mode: ChallengeMode;
  groupId?: string | null;
  source: CreateEntrySource;
  templateId?: CommitmentTemplateId;
  title?: string;
  verificationType?: string;
  reminderTime?: string;
};

export type CreateHubRouteParams = {
  openCreateModal: '1';
  createSource: CreateEntrySource | string;
  createIntent?: CreationIntent;
  createModalNonce?: string;
};

let pendingCreateHubOpen: CreateHubRouteParams | null = null;
const createHubOpenListeners = new Set<() => void>();

export const queueCreateHubOpen = (params: CreateHubRouteParams): boolean => {
  pendingCreateHubOpen = params;
  const hasMountedListener = createHubOpenListeners.size > 0;
  createHubOpenListeners.forEach(listener => listener());
  return hasMountedListener;
};

export const consumeCreateHubOpen = (): CreateHubRouteParams | null => {
  const pending = pendingCreateHubOpen;
  pendingCreateHubOpen = null;
  return pending;
};

export const subscribeCreateHubOpen = (listener: () => void) => {
  createHubOpenListeners.add(listener);
  return () => {
    createHubOpenListeners.delete(listener);
  };
};

export const parseCreateHubFromNormalizedPath = (
  normalizedPath: string
): CreateHubRouteParams | null => {
  if (!normalizedPath.startsWith('/(tabs)')) {
    return null;
  }

  const queryIndex = normalizedPath.indexOf('?');
  if (queryIndex === -1) {
    return null;
  }

  const query = new URLSearchParams(normalizedPath.slice(queryIndex + 1));
  const openCreateModal = query.get('openCreateModal');
  if (openCreateModal !== '1' && openCreateModal !== 'true') {
    return null;
  }

  const createSource = query.get('createSource') ?? 'home_plus';
  const rawIntent = query.get('createIntent');

  return {
    openCreateModal: '1',
    createSource,
    ...(isCreationIntent(rawIntent ?? undefined)
      ? { createIntent: rawIntent as CreationIntent }
      : {}),
  };
};

export const buildCreateHubHref = (
  source: CreateEntrySource,
  intent?: CreationIntent
): Href => {
  const search = new URLSearchParams({
    openCreateModal: '1',
    createSource: source,
    ...(intent ? { createIntent: intent } : {}),
  });

  return `/(tabs)?${search.toString()}` as Href;
};

export const buildCreateChallengeHref = (
  options: CreateChallengeHrefOptions
): Href => {
  const params: Record<string, string> = {
    mode: options.mode,
    createSource: options.source,
  };

  if (options.mode === 'group' && options.groupId) {
    params.groupId = options.groupId;
  }

  if (options.templateId) {
    params.templateId = options.templateId;
  }
  if (options.title) {
    params.title = options.title;
  }
  if (options.verificationType) {
    params.verificationType = options.verificationType;
  }
  if (options.reminderTime) {
    params.reminderTime = options.reminderTime;
  }

  const search = new URLSearchParams(params);
  return `/create-challenge?${search.toString()}` as Href;
};

export const buildCreateGroupHref = (
  source: CreateEntrySource,
  templateId?: CommitmentTemplateId,
  groupName?: string
): Href => {
  const search = new URLSearchParams({
    createSource: source,
    ...(templateId ? { templateId } : {}),
    ...(groupName ? { groupName } : {}),
  });

  return `/create-group?${search.toString()}` as Href;
};

export const isCreationIntent = (
  value: string | string[] | undefined
): value is CreationIntent => {
  const normalized = Array.isArray(value) ? value[0] : value;
  return (
    normalized === 'create_group' ||
    normalized === 'create_group_challenge' ||
    normalized === 'create_solo_challenge'
  );
};

export const openCreateHub = ({
  router,
  source,
  intent,
}: OpenCreateHubOptions): void => {
  const openedInMountedTabs = queueCreateHubOpen({
    openCreateModal: '1',
    createSource: source,
    ...(intent ? { createIntent: intent } : {}),
  });

  if (!openedInMountedTabs) {
    router.push(buildCreateHubHref(source, intent));
  }
};

export const openCreateGroup = async ({
  router,
  source,
  checkGroupCooldown,
  templateId,
}: OpenCreateGroupOptions): Promise<boolean> => {
  if (checkGroupCooldown) {
    const inCooldown = await checkGroupCooldown();
    if (inCooldown) {
      return false;
    }
  }

  router.push(buildCreateGroupHref(source, templateId));
  return true;
};

export const openCreateGroupChallenge = ({
  router,
  source,
  groupId,
  templateId,
}: OpenCreateGroupChallengeOptions): void => {
  router.push(
    buildCreateChallengeHref({
      mode: 'group',
      groupId: groupId ?? null,
      source,
      templateId,
    })
  );
};

export const openCreateSoloChallenge = ({
  router,
  source,
  templateId,
  title,
  verificationType,
  reminderTime,
}: OpenCreateWithTemplateOptions): void => {
  router.push(
    buildCreateChallengeHref({
      mode: 'solo',
      source,
      templateId,
      title,
      verificationType,
      reminderTime,
    })
  );
};
