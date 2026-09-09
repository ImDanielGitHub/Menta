import { useTranslation } from '@/lib/localization';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import {
  AppButton,
  AppDivider,
  AppInlineNotice,
  AppScreen,
  AppTextArea,
  AppTextField,
  SkeletonLoader,
} from '@/components/ui';
import { SupportPageHeader } from '@/components/support/SupportPageHeader';
import { SupportLedgerCard } from '@/components/support/SupportSurface';
import { CheckCircleIcon } from '@/components/ui/icons';
import { AppChoiceChip } from '@/components/ui/AppChoice';
import { trackProductEvent } from '@/lib/posthog';
import { supabase } from '@/lib/supabase';
import { useNetworkState } from '@/lib/network';
import { backOrReplace } from '@/lib/navigation/safe-back';
import {
  createConfirmedReceipt,
  emitConfirmedSuccess,
  emitHaptic,
} from '@/lib/motion/haptics';
import {
  beginReportSubmission,
  createReportDraft,
  getLatestOpenReportDraft,
  getOpenReportDraftByIdForUser,
  getReportDraftCopy,
  isDefinitiveReportRejection,
  isResponseUnknownError,
  removeReportDraft,
  type ReportAttachmentMetadata,
  type ReportDraft,
  type ReportSubmissionSnapshot,
  updateReportDraft,
} from '@/lib/report-drafts';
import {
  reportingService,
  type ContentReportFacts,
  type ReportDeliveryOutcome,
  type ReportTargetType,
} from '@/lib/services/reporting';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

type ReportIssueParams = {
  draftId?: string | string[];
  mode?: string | string[];
  newReport?: string | string[];
  reportKind?: string | string[];
  source?: string | string[];
  challengeId?: string | string[];
  groupId?: string | string[];
  submissionId?: string | string[];
  userId?: string | string[];
  userLabel?: string | string[];
  contextLabel?: string | string[];
  title?: string | string[];
  description?: string | string[];
  observedBehavior?: string | string[];
  expectedBehavior?: string | string[];
  stepsToReproduce?: string | string[];
  crashReference?: string | string[];
  attachmentName?: string | string[];
  attachmentMimeType?: string | string[];
  attachmentSizeBytes?: string | string[];
  attachmentUri?: string | string[];
};

type ReportNotice = {
  tone: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
} | null;

type AccountScope = {
  ownerId: string;
  epoch: number;
};

const MAX_SUPPORT_SCREENSHOT_BYTES = 8 * 1024 * 1024;
const FEEDBACK_REASONS = [
  { id: 'broken', label: 'Something is not working' },
  { id: 'confusing', label: 'A screen is confusing' },
  { id: 'slow', label: 'The app feels slow' },
  { id: 'missing', label: 'I have a feature idea' },
  { id: 'working_well', label: 'What is working well' },
  { id: 'other', label: 'Something else' },
] as const;
const SUPPORT_SCREENSHOT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const supportScreenshotExtension = (mimeType: string): string => {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
};

class ReportDeliveryError extends Error {
  readonly outcome: Exclude<ReportDeliveryOutcome, 'confirmed'>;

  constructor(
    outcome: Exclude<ReportDeliveryOutcome, 'confirmed'>,
    message: string
  ) {
    super(message);
    this.name = 'ReportDeliveryError';
    this.outcome = outcome;
  }
}

const getSingleParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const foldObservedBehaviorIntoDescription = (
  description: string,
  observedBehavior: string
) => {
  const visibleDescription = description.trim();
  const observation = observedBehavior.trim();

  if (!observation || visibleDescription.includes(observation)) {
    return description;
  }
  if (!visibleDescription) return observation;

  return `${visibleDescription}\n\nObserved behaviour: ${observation}`;
};

const getContentReportTarget = (
  snapshot: ReportSubmissionSnapshot
): { type: ReportTargetType; id: string } | null => {
  if (snapshot.reportKind === 'submission' && snapshot.submissionId) {
    return { type: 'verification', id: snapshot.submissionId };
  }
  if (snapshot.reportKind === 'challenge' && snapshot.challengeId) {
    return { type: 'challenge', id: snapshot.challengeId };
  }
  if (snapshot.reportKind === 'group' && snapshot.groupId) {
    return { type: 'group', id: snapshot.groupId };
  }
  if (snapshot.reportKind === 'user' && snapshot.targetUserId) {
    return { type: 'user', id: snapshot.targetUserId };
  }
  return null;
};

const buildContentReportFacts = (
  snapshot: ReportSubmissionSnapshot,
  draftId: string
): ContentReportFacts => ({
  title: snapshot.title,
  description: snapshot.description,
  observed_behavior: snapshot.observedBehavior,
  expected_behavior: snapshot.expectedBehavior,
  steps_to_reproduce: snapshot.stepsToReproduce,
  source: snapshot.source,
  report_kind: snapshot.reportKind ?? '',
  challenge_id: snapshot.challengeId,
  group_id: snapshot.groupId,
  submission_id: snapshot.submissionId,
  target_user_id: snapshot.targetUserId,
  target_user_label: snapshot.targetUserLabel,
  context_label: snapshot.contextLabel,
  crash_reference: snapshot.crashReference,
  attachments: snapshot.attachments.map(attachment => ({
    name: attachment.name,
    mime_type: attachment.mimeType,
    size_bytes: attachment.sizeBytes,
  })),
  attachment_state:
    snapshot.attachments.length > 0
      ? 'metadata retained locally; files not uploaded'
      : 'none',
  snapshot_created_at: snapshot.createdAt,
  report_draft_id: draftId,
});

export default function ReportIssueScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<ReportIssueParams>();
  const { user, isAuthenticated } = useAuthStore();
  const network = useNetworkState();

  const requestedDraftId = getSingleParam(params.draftId);
  const reportMode = getSingleParam(params.mode);
  const createNewReport = getSingleParam(params.newReport) === '1';
  const reportKind = getSingleParam(params.reportKind);
  const source = getSingleParam(params.source) ?? 'report_issue_screen';
  const challengeId = getSingleParam(params.challengeId);
  const groupId = getSingleParam(params.groupId);
  const submissionId = getSingleParam(params.submissionId);
  const targetUserId = getSingleParam(params.userId);
  const targetUserLabel = getSingleParam(params.userLabel) ?? 'this person';
  const contextLabel = getSingleParam(params.contextLabel);
  const initialTitle = getSingleParam(params.title);
  const initialDescription = getSingleParam(params.description);
  const initialObservedBehavior = getSingleParam(params.observedBehavior);
  const initialExpectedBehavior = getSingleParam(params.expectedBehavior);
  const initialStepsToReproduce = getSingleParam(params.stepsToReproduce);
  const crashReference = getSingleParam(params.crashReference);
  const attachmentName = getSingleParam(params.attachmentName);
  const attachmentMimeType = getSingleParam(params.attachmentMimeType);
  const attachmentSizeBytes = getSingleParam(params.attachmentSizeBytes);
  const attachmentUri = getSingleParam(params.attachmentUri);
  const isRouteContextualReport = Boolean(
    challengeId || groupId || submissionId || targetUserId || reportKind
  );

  const initialForm = useMemo(
    () => ({
      title:
        initialTitle ??
        (reportMode === 'feedback'
          ? t('fullAuth.residual.report.feedback_title')
          : isRouteContextualReport && contextLabel
            ? `Report: ${contextLabel}`
            : ''),
      description: foldObservedBehaviorIntoDescription(
        initialDescription ?? '',
        initialObservedBehavior ?? ''
      ),
      observedBehavior: '',
      expectedBehavior: initialExpectedBehavior ?? '',
      stepsToReproduce: initialStepsToReproduce ?? '',
    }),
    [
      contextLabel,
      initialDescription,
      initialExpectedBehavior,
      initialObservedBehavior,
      initialStepsToReproduce,
      initialTitle,
      isRouteContextualReport,
      reportMode,
      t,
    ]
  );
  const attachments = useMemo<ReportAttachmentMetadata[]>(() => {
    if (!attachmentName) return [];
    const parsedSize = Number(attachmentSizeBytes);
    return [
      {
        name: attachmentName,
        mimeType: attachmentMimeType ?? null,
        sizeBytes: Number.isFinite(parsedSize) ? parsedSize : null,
        localUri: attachmentUri ?? null,
      },
    ];
  }, [attachmentMimeType, attachmentName, attachmentSizeBytes, attachmentUri]);
  const contextKey = useMemo(
    () =>
      [
        source,
        reportKind,
        challengeId,
        groupId,
        submissionId,
        targetUserId,
        crashReference,
      ]
        .filter(Boolean)
        .join(':') || 'report_issue_screen:general',
    [
      challengeId,
      crashReference,
      groupId,
      reportKind,
      source,
      submissionId,
      targetUserId,
    ]
  );
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [retainedAttachments, setRetainedAttachments] = useState(attachments);
  const [title, setTitle] = useState(initialForm.title);
  const [description, setDescription] = useState(initialForm.description);
  const [expectedBehavior, setExpectedBehavior] = useState(
    initialForm.expectedBehavior
  );
  const [stepsToReproduce, setStepsToReproduce] = useState(
    initialForm.stepsToReproduce
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChoosingScreenshot, setIsChoosingScreenshot] = useState(false);
  const [showScreenshotOptions, setShowScreenshotOptions] = useState(
    attachments.length > 0
  );
  const [showOptionalDetails, setShowOptionalDetails] = useState(
    Boolean(initialForm.expectedBehavior || initialForm.stepsToReproduce)
  );
  const [reportStep, setReportStep] = useState<1 | 2>(1);
  const [reportNotice, setReportNotice] = useState<ReportNotice>(null);
  const [requestedDraftMissing, setRequestedDraftMissing] = useState(false);
  const saveQueue = useRef(Promise.resolve());
  const activeSessionUser = isAuthenticated ? user : null;
  const currentAccountId = activeSessionUser?.id ?? null;
  const accountScopeRef = useRef<{
    ownerId: string | null;
    epoch: number;
  }>({ ownerId: currentAccountId, epoch: 0 });
  if (accountScopeRef.current.ownerId !== currentAccountId) {
    accountScopeRef.current = {
      ownerId: currentAccountId,
      epoch: accountScopeRef.current.epoch + 1,
    };
  }
  const isAccountScopeCurrent = useCallback((scope: AccountScope) => {
    const current = accountScopeRef.current;
    return current.ownerId === scope.ownerId && current.epoch === scope.epoch;
  }, []);
  const routeOwnerId = useRef(activeSessionUser?.id ?? null);

  if (routeOwnerId.current === null && activeSessionUser?.id) {
    routeOwnerId.current = activeSessionUser.id;
  }

  const routeBelongsToActiveUser =
    routeOwnerId.current === null ||
    routeOwnerId.current === activeSessionUser?.id;
  const activeDraft =
    draft && activeSessionUser?.id === draft.userId ? draft : null;
  const isFeedback =
    reportMode === 'feedback' ||
    activeDraft?.source === 'settings_feedback' ||
    activeDraft?.source === 'activation_feedback';
  const draftId = activeDraft?.id;
  const draftStatus = activeDraft?.status;
  // Once a saved draft is selected, every saved value (including null) wins.
  // Route parameters may describe a different account or content record.
  const activeReportKind = activeDraft ? activeDraft.reportKind : reportKind;
  const activeChallengeId = activeDraft ? activeDraft.challengeId : challengeId;
  const activeGroupId = activeDraft ? activeDraft.groupId : groupId;
  const activeSubmissionId = activeDraft
    ? activeDraft.submissionId
    : submissionId;
  const activeTargetUserId = activeDraft
    ? activeDraft.targetUserId
    : targetUserId;
  const activeCrashReference = activeDraft
    ? activeDraft.crashReference
    : crashReference;
  const isContextualReport = Boolean(
    activeChallengeId ||
    activeGroupId ||
    activeSubmissionId ||
    activeTargetUserId ||
    activeReportKind
  );
  const isContentReport = Boolean(
    (activeReportKind === 'submission' && activeSubmissionId) ||
    (activeReportKind === 'challenge' && activeChallengeId) ||
    (activeReportKind === 'group' && activeGroupId) ||
    (activeReportKind === 'user' && activeTargetUserId)
  );

  const closeConfirmedReport = useCallback(() => {
    if (!activeDraft || !activeSessionUser) return;
    const scope: AccountScope = {
      ownerId: activeSessionUser.id,
      epoch: accountScopeRef.current.epoch,
    };
    void removeReportDraft(scope.ownerId, activeDraft.id).finally(() => {
      if (isAccountScopeCurrent(scope)) router.replace('/support');
    });
  }, [activeDraft, activeSessionUser, isAccountScopeCurrent, router]);

  const applyDraft = (next: ReportDraft) => {
    setDraft(next);
    setReportStep(1);
    setTitle(next.title);
    setDescription(
      foldObservedBehaviorIntoDescription(
        next.description,
        next.observedBehavior
      )
    );
    setExpectedBehavior(next.expectedBehavior);
    setStepsToReproduce(next.stepsToReproduce);
    setRetainedAttachments(next.attachments);
    setShowScreenshotOptions(next.attachments.length > 0);
    setShowOptionalDetails(
      Boolean(next.expectedBehavior || next.stepsToReproduce)
    );
  };

  const clearVisibleReport = useCallback(() => {
    setDraft(null);
    setReportStep(1);
    setRetainedAttachments([]);
    setShowScreenshotOptions(false);
    setShowOptionalDetails(false);
    setTitle('');
    setDescription('');
    setExpectedBehavior('');
    setStepsToReproduce('');
  }, []);

  useEffect(() => {
    setReportNotice(null);
    setIsSubmitting(false);
    if (!activeSessionUser) {
      clearVisibleReport();
      return;
    }
    if (!routeBelongsToActiveUser) {
      clearVisibleReport();
      return;
    }

    setDraft(current => {
      if (current?.userId !== activeSessionUser.id) return null;
      if (requestedDraftId) {
        return current.id === requestedDraftId ? current : null;
      }
      return current.contextKey === contextKey && !createNewReport
        ? current
        : null;
    });

    let active = true;
    setRequestedDraftMissing(false);
    void (async () => {
      const existing = requestedDraftId
        ? await getOpenReportDraftByIdForUser(
            activeSessionUser.id,
            requestedDraftId
          )
        : createNewReport
          ? null
          : await getLatestOpenReportDraft(activeSessionUser.id, contextKey);
      if (requestedDraftId && !existing) {
        if (active) {
          setRequestedDraftMissing(true);
          setReportNotice({
            tone: 'warning',
            title: t('fullAuth.report_issue.could_not_find_this_saved_report'),
            description: t(
              'fullAuth.report_issue.it_is_not_saved_under_this_account_nothing_was_c'
            ),
          });
        }
        return;
      }
      const next =
        existing ??
        (await createReportDraft({
          userId: activeSessionUser.id,
          contextKey,
          source,
          reportKind: reportKind ?? null,
          challengeId: challengeId ?? null,
          groupId: groupId ?? null,
          submissionId: submissionId ?? null,
          targetUserId: targetUserId ?? null,
          targetUserLabel: targetUserId ? targetUserLabel : null,
          contextLabel: contextLabel ?? null,
          crashReference: crashReference ?? null,
          attachments,
          ...initialForm,
        }));
      if (active && next.userId === activeSessionUser.id) {
        setRequestedDraftMissing(false);
        applyDraft(next);
        if (createNewReport) {
          router.setParams({ draftId: next.id, newReport: '' });
        }
      }
    })().catch(() => {
      if (!active) return;
      setReportNotice({
        tone: 'warning',
        title: t('fullAuth.report_issue.this_report_is_not_being_saved'),
        description: t(
          'fullAuth.report_issue.keep_this_screen_open_while_you_write_or_copy_th'
        ),
      });
    });

    return () => {
      active = false;
    };
  }, [
    attachments,
    challengeId,
    contextKey,
    contextLabel,
    crashReference,
    groupId,
    initialForm,
    reportKind,
    source,
    submissionId,
    targetUserId,
    targetUserLabel,
    routeBelongsToActiveUser,
    activeSessionUser,
    clearVisibleReport,
    createNewReport,
    requestedDraftId,
    router,
  ]);

  useEffect(() => {
    if (
      !draftId ||
      !activeSessionUser ||
      isSubmitting ||
      draftStatus === 'server-confirmed'
    )
      return;
    const scope: AccountScope = {
      ownerId: activeSessionUser.id,
      epoch: accountScopeRef.current.epoch,
    };
    const patch = {
      title,
      description,
      observedBehavior: '',
      expectedBehavior,
      stepsToReproduce,
      attachments: retainedAttachments,
    };
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(async () => {
        if (!isAccountScopeCurrent(scope)) return;
        const saved = await updateReportDraft(scope.ownerId, draftId, patch);
        if (!isAccountScopeCurrent(scope)) return;
        setDraft(current =>
          current?.id === saved.id && current.userId === scope.ownerId
            ? saved
            : current
        );
      });
  }, [
    activeSessionUser,
    description,
    draftId,
    draftStatus,
    expectedBehavior,
    isSubmitting,
    isAccountScopeCurrent,
    retainedAttachments,
    stepsToReproduce,
    title,
  ]);

  const updateField = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value);
    if (reportNotice?.tone === 'error' || reportNotice?.tone === 'warning') {
      setReportNotice(null);
    }
  };

  const chooseScreenshot = useCallback(async () => {
    if (isChoosingScreenshot || isSubmitting || isContentReport) return;

    setIsChoosingScreenshot(true);
    setReportNotice(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      if (!SUPPORT_SCREENSHOT_MIME_TYPES.has(mimeType)) {
        setReportNotice({
          tone: 'warning',
          title: t('fullAuth.report_issue.choose_an_image'),
          description: t(
            'fullAuth.report_issue.attach_a_jpeg_png_or_webp_screenshot'
          ),
        });
        return;
      }
      if (asset.fileSize && asset.fileSize > MAX_SUPPORT_SCREENSHOT_BYTES) {
        setReportNotice({
          tone: 'warning',
          title: t('fullAuth.report_issue.screenshot_is_too_large'),
          description: t(
            'fullAuth.report_issue.choose_a_screenshot_smaller_than_8_mb'
          ),
        });
        return;
      }

      setRetainedAttachments([
        {
          name:
            asset.fileName ??
            `screenshot.${supportScreenshotExtension(mimeType)}`,
          mimeType,
          sizeBytes: asset.fileSize ?? null,
          localUri: asset.uri,
        },
      ]);
      if (isFeedback)
        trackProductEvent('Feedback Journey', {
          action: 'screenshot_selected',
          source: 'feedback_form',
          has_screenshot: true,
        });
    } catch {
      setReportNotice({
        tone: 'error',
        title: t('fullAuth.report_issue.screenshot_did_not_open'),
        description: t(
          'fullAuth.report_issue.menta_could_not_open_your_photo_library_try_agai'
        ),
      });
    } finally {
      setIsChoosingScreenshot(false);
    }
  }, [isChoosingScreenshot, isContentReport, isFeedback, isSubmitting, t]);

  const reviewReport = () => {
    if (!title.trim() || !description.trim()) {
      setReportNotice({
        tone: 'warning',
        title: t('fullAuth.report_issue.add_the_basics'),
        description: t(
          'fullAuth.report_issue.give_the_report_a_short_title_and_explain_what_h'
        ),
      });
      return;
    }

    setReportNotice(null);
    setReportStep(2);
  };

  const handleSubmit = async () => {
    if (isSubmitting || activeDraft?.status === 'server-confirmed') return;
    if (!activeSessionUser || !routeBelongsToActiveUser) {
      setReportNotice({
        tone: 'error',
        title: t('fullAuth.report_issue.sign_in_required'),
        description: t(
          'fullAuth.report_issue.sign_in_again_before_sending_this_private_report'
        ),
      });
      return;
    }

    if (!title.trim() || !description.trim()) {
      setReportNotice({
        tone: 'warning',
        title: t('fullAuth.report_issue.add_the_basics'),
        description: t(
          'fullAuth.report_issue.give_the_report_a_short_title_and_explain_what_h'
        ),
      });
      return;
    }

    if (!activeDraft) return;
    const scope: AccountScope = {
      ownerId: activeSessionUser.id,
      epoch: accountScopeRef.current.epoch,
    };
    const retainUnconfirmedAttempt = async (
      status: 'not-sent' | 'result-unknown',
      lastError: string
    ) => {
      try {
        await updateReportDraft(scope.ownerId, activeDraft.id, {
          status,
          lastError,
        });
      } catch {
        // The exact account-owned draft may already have been cleared. Never
        // create or update another draft as a fallback.
      }
    };
    const online =
      network.isConnected !== false && network.isInternetReachable !== false;
    if (!online) {
      try {
        const retained = await updateReportDraft(
          scope.ownerId,
          activeDraft.id,
          {
            title,
            description,
            observedBehavior: '',
            expectedBehavior,
            stepsToReproduce,
            attachments: retainedAttachments,
            status: 'not-sent',
            lastError: 'offline',
          }
        );
        if (!isAccountScopeCurrent(scope)) return;
        setDraft(retained);
        setReportNotice({
          tone: 'warning',
          ...getReportDraftCopy(retained.status),
        });
      } catch {
        if (!isAccountScopeCurrent(scope)) return;
        setReportNotice({
          tone: 'error',
          title: t('fullAuth.report_issue.report_not_sent'),
          description: t(
            'fullAuth.report_issue.menta_could_not_preserve_this_report_locally_kee'
          ),
        });
      }
      return;
    }

    setIsSubmitting(true);
    setReportNotice(null);
    let sendStarted = false;
    const uploadedAttachmentPaths: string[] = [];
    const cleanupUploadedAttachments = async () => {
      if (uploadedAttachmentPaths.length === 0) return;

      const paths = [...uploadedAttachmentPaths];
      const removed = await supabase.storage
        .from('support-attachments')
        .remove(paths);
      if (!removed.error) {
        uploadedAttachmentPaths.splice(0, uploadedAttachmentPaths.length);
      }
    };

    try {
      await saveQueue.current.catch(() => undefined);
      if (!isAccountScopeCurrent(scope)) return;
      const current = await updateReportDraft(scope.ownerId, activeDraft.id, {
        title,
        description,
        observedBehavior: '',
        expectedBehavior,
        stepsToReproduce,
        attachments: retainedAttachments,
      });
      if (!isAccountScopeCurrent(scope)) return;
      const submitting = await beginReportSubmission(scope.ownerId, current.id);
      if (!isAccountScopeCurrent(scope)) {
        await retainUnconfirmedAttempt(
          'not-sent',
          'account changed before send'
        );
        return;
      }
      setDraft(submitting);
      const snapshot = submitting.submissionSnapshot;
      if (!snapshot) throw new Error('Report snapshot was not saved');
      const contentTarget = getContentReportTarget(snapshot);
      const uploadedAttachments: {
        name: string;
        mimeType: string;
        sizeBytes: number;
        storagePath: string;
      }[] = [];
      if (!contentTarget) {
        for (const [index, attachment] of snapshot.attachments.entries()) {
          if (!isAccountScopeCurrent(scope)) {
            await cleanupUploadedAttachments().catch(() => undefined);
            await retainUnconfirmedAttempt(
              'not-sent',
              'account changed before screenshot upload'
            );
            return;
          }
          if (!attachment.localUri) continue;
          const response = await fetch(attachment.localUri);
          if (!response.ok) {
            throw new Error('Menta could not read the selected screenshot.');
          }
          const blob = await response.blob();
          const mimeType = attachment.mimeType ?? blob.type;
          if (!SUPPORT_SCREENSHOT_MIME_TYPES.has(mimeType)) {
            throw new Error('The selected screenshot format is not supported.');
          }
          const sizeBytes = Math.max(attachment.sizeBytes ?? 0, blob.size);
          if (sizeBytes <= 0 || sizeBytes > MAX_SUPPORT_SCREENSHOT_BYTES) {
            throw new Error('The selected screenshot is larger than 8 MB.');
          }
          const storagePath =
            `${scope.ownerId}/${submitting.id}/screenshot-${index + 1}.` +
            supportScreenshotExtension(mimeType);
          const uploaded = await supabase.storage
            .from('support-attachments')
            .upload(storagePath, blob, {
              contentType: mimeType,
              upsert: false,
            });
          if (
            uploaded.error &&
            !/already exists|duplicate|resourcealreadyexists/i.test(
              uploaded.error.message
            )
          ) {
            throw uploaded.error;
          }
          uploadedAttachmentPaths.push(storagePath);
          if (!isAccountScopeCurrent(scope)) {
            await cleanupUploadedAttachments().catch(() => undefined);
            await retainUnconfirmedAttempt(
              'not-sent',
              'account changed during screenshot upload'
            );
            return;
          }
          uploadedAttachments.push({
            name: attachment.name,
            mimeType,
            sizeBytes,
            storagePath,
          });
        }
      }
      const issue = {
        id: submitting.id,
        user_id: scope.ownerId,
        issue_type:
          snapshot.reportKind === 'challenge'
            ? 'challenge_report'
            : snapshot.reportKind === 'group'
              ? 'group_report'
              : snapshot.reportKind === 'submission'
                ? 'submission_report'
                : 'bug_report',
        title: snapshot.title,
        description: snapshot.description,
        status: t('fullAuth.report_issue.open'),
        metadata: {
          observedBehavior: snapshot.observedBehavior,
          expectedBehavior: snapshot.expectedBehavior,
          stepsToReproduce: snapshot.stepsToReproduce,
          source: snapshot.source,
          reportKind: snapshot.reportKind,
          challengeId: snapshot.challengeId,
          groupId: snapshot.groupId,
          submissionId: snapshot.submissionId,
          targetUserId: snapshot.targetUserId,
          targetUserLabel: snapshot.targetUserLabel,
          contextLabel: snapshot.contextLabel,
          crashReference: snapshot.crashReference,
          attachmentState:
            uploadedAttachments.length > 0
              ? 'uploaded to private support storage'
              : 'none',
          attachments: contentTarget
            ? snapshot.attachments.map(attachment => ({
                name: attachment.name,
                mimeType: attachment.mimeType,
                sizeBytes: attachment.sizeBytes,
              }))
            : uploadedAttachments,
          snapshotCreatedAt: snapshot.createdAt,
          reportDraftId: submitting.id,
        },
      };
      let receiptId: string | null = null;
      if (contentTarget) {
        sendStarted = true;
        const result = await reportingService.submitContentReport({
          expectedReporterId: scope.ownerId,
          clientEventId: submitting.id,
          targetType: contentTarget.type,
          targetId: contentTarget.id,
          reason: 'inappropriate',
          facts: buildContentReportFacts(snapshot, submitting.id),
        });
        if (!isAccountScopeCurrent(scope)) {
          await retainUnconfirmedAttempt(
            result.outcome === 'not-sent' ? 'not-sent' : 'result-unknown',
            'account changed while report response was pending'
          );
          return;
        }
        if (
          !result.success ||
          !result.receiptId ||
          result.reporterId !== scope.ownerId ||
          result.clientEventId !== submitting.id
        ) {
          throw new ReportDeliveryError(
            result.outcome === 'not-sent' ? 'not-sent' : 'result-unknown',
            result.message ?? 'Report was not confirmed'
          );
        }
        receiptId = result.receiptId;
      } else {
        sendStarted = true;
        const inserted = await supabase
          .from('issues')
          .insert(issue)
          .select('id')
          .single();
        if (!isAccountScopeCurrent(scope)) {
          await retainUnconfirmedAttempt(
            'result-unknown',
            'account changed while report response was pending'
          );
          return;
        }
        receiptId = inserted.data?.id ?? null;
        if (inserted.error?.code === '23505') {
          const existing = await supabase
            .from('issues')
            .select('id')
            .eq('id', submitting.id)
            .single();
          if (!isAccountScopeCurrent(scope)) {
            await retainUnconfirmedAttempt(
              'result-unknown',
              'account changed while report receipt was loading'
            );
            return;
          }
          if (existing.error) throw existing.error;
          receiptId = existing.data.id;
        } else if (inserted.error) {
          throw inserted.error;
        }
      }
      if (!receiptId) throw new Error('Server did not return a report receipt');
      if (!isAccountScopeCurrent(scope)) {
        await retainUnconfirmedAttempt(
          'result-unknown',
          'account changed before report receipt was saved'
        );
        return;
      }

      const confirmed = await updateReportDraft(scope.ownerId, submitting.id, {
        status: 'server-confirmed',
        serverReceiptId: receiptId,
        lastError: null,
      });
      if (!isAccountScopeCurrent(scope)) return;
      setDraft(confirmed);
      if (isFeedback)
        trackProductEvent('Feedback Journey', {
          action: 'submitted',
          source: 'feedback_form',
          has_screenshot: retainedAttachments.length > 0,
        });
      void emitConfirmedSuccess(createConfirmedReceipt('generic', receiptId));
      setReportNotice({
        tone: 'success',
        ...getReportDraftCopy(confirmed.status),
      });
    } catch (error) {
      const status: 'not-sent' | 'result-unknown' =
        error instanceof ReportDeliveryError
          ? error.outcome
          : sendStarted &&
              (isResponseUnknownError(error) ||
                !isDefinitiveReportRejection(error))
            ? 'result-unknown'
            : 'not-sent';
      if (isFeedback)
        trackProductEvent('Feedback Journey', {
          action: 'failed',
          source: 'feedback_form',
          has_screenshot: retainedAttachments.length > 0,
        });
      if (status === 'not-sent') {
        await cleanupUploadedAttachments().catch(() => undefined);
      }
      try {
        const retained = await updateReportDraft(
          scope.ownerId,
          activeDraft.id,
          {
            status,
            lastError: String((error as Error)?.message ?? 'submission failed'),
          }
        );
        if (!isAccountScopeCurrent(scope)) return;
        setDraft(retained);
      } catch {
        if (!isAccountScopeCurrent(scope)) return;
        setReportNotice({
          tone: 'error',
          title: t('fullAuth.report_issue.report_not_sent'),
          description: t(
            'fullAuth.report_issue.menta_could_not_preserve_this_report_locally_kee'
          ),
        });
        return;
      }
      setReportNotice({
        tone: status === 'result-unknown' ? 'warning' : 'error',
        ...getReportDraftCopy(status),
      });
      if (status === 'result-unknown') {
        void emitHaptic({ type: 'unknown' });
      } else {
        void emitHaptic({ type: 'failed', operation: 'submit' });
      }
    } finally {
      if (isAccountScopeCurrent(scope)) setIsSubmitting(false);
    }
  };

  if (!activeDraft) {
    return (
      <AppScreen
        lane="working"
        hasTabBar={false}
        scrollable
        contentContainerStyle={styles.screen}
      >
        <SupportPageHeader
          onBack={() => backOrReplace(router, '/support')}
          title={t('fullAuth.report_issue.report_an_issue')}
        />
        {activeSessionUser && routeBelongsToActiveUser ? (
          <View
            accessibilityLabel={t(
              'fullAuth.report_issue.preparing_private_report_draft'
            )}
            accessibilityRole="progressbar"
            style={styles.draftSkeleton}
          >
            <SkeletonLoader announce={false} height={16} width="34%" />
            <SkeletonLoader announce={false} height={34} width="78%" />
            <SkeletonLoader announce={false} height={56} width="100%" />
            <SkeletonLoader announce={false} height={120} width="100%" />
          </View>
        ) : null}
        {reportNotice || !activeSessionUser || !routeBelongsToActiveUser ? (
          <AppInlineNotice
            description={
              reportNotice?.description ??
              (!activeSessionUser
                ? t('fullAuth.residual.report.sign_in_description')
                : t('fullAuth.residual.report.return_description'))
            }
            title={
              reportNotice?.title ??
              (!activeSessionUser
                ? t('fullAuth.residual.report.sign_in_required')
                : t('fullAuth.residual.report.other_account'))
            }
            tone={reportNotice?.tone ?? 'info'}
          />
        ) : null}
        {activeSessionUser &&
        (!routeBelongsToActiveUser ||
          (requestedDraftId && requestedDraftMissing)) ? (
          <AppButton
            fullWidth
            onPress={() => router.replace('/support')}
            title={
              routeBelongsToActiveUser
                ? t('fullAuth.report_issue.choose_another_report')
                : t('fullAuth.report_issue.return_to_support')
            }
            variant="secondary"
          />
        ) : null}
      </AppScreen>
    );
  }

  if (activeDraft.status === 'server-confirmed') {
    return (
      <AppScreen
        lane="working"
        contentContainerStyle={styles.receiptScreen}
        hasTabBar={false}
        scrollable
        testID="report-received-screen"
      >
        <SupportPageHeader
          onBack={closeConfirmedReport}
          title={
            isFeedback
              ? t('fullAuth.report_issue.feedback_received')
              : t('fullAuth.report_issue.report_received')
          }
        />
        <View style={styles.receiptBody}>
          <CheckCircleIcon color={mentaColors.success} size={30} />
          <View style={styles.receiptCopy}>
            <Text style={styles.receiptDescription}>
              {isContentReport
                ? t('fullAuth.residual.report.received_content')
                : isFeedback
                  ? t('fullAuth.residual.report.received_feedback')
                  : t('fullAuth.residual.report.received_report')}
            </Text>
          </View>
          <SupportLedgerCard style={styles.receiptCard}>
            <View style={styles.receiptStatusRow}>
              <Text style={styles.receiptLabel}>
                {t('fullAuth.report_issue.status')}
              </Text>
              <Text style={styles.receiptStatus}>
                {isContentReport
                  ? t('fullAuth.residual.report.status_received')
                  : t('fullAuth.residual.report.status_queued')}
              </Text>
            </View>
            <AppDivider muted />
            <View style={styles.receiptStatusRow}>
              <Text style={styles.receiptLabel}>
                {t('fullAuth.report_issue.reference')}
              </Text>
              <Text selectable style={styles.receiptCardCopy}>
                {activeDraft.serverReceiptId}
              </Text>
            </View>
          </SupportLedgerCard>
        </View>
        <View style={styles.receiptFooter}>
          <AppButton
            fullWidth
            onPress={closeConfirmedReport}
            size="large"
            title={t('fullAuth.report_issue.back_to_support')}
            variant="accent"
          />
        </View>
      </AppScreen>
    );
  }

  const categoryLabel =
    activeDraft.reportKind === 'challenge'
      ? t('fullAuth.residual.report.category_promise')
      : activeDraft.reportKind === 'group'
        ? t('fullAuth.residual.report.category_group')
        : activeDraft.reportKind === 'submission'
          ? t('fullAuth.residual.report.category_proof')
          : activeReportKind === 'user'
            ? t('fullAuth.residual.report.category_member')
            : isFeedback
              ? t('fullAuth.residual.report.feedback_label')
              : t('fullAuth.residual.report.category_app_issue');

  const characterCount = (value: string, limit: number) =>
    value.length >= Math.floor(limit * 0.8)
      ? `${value.length}/${limit} characters`
      : undefined;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardAvoiding}
    >
      <AppScreen
        lane="working"
        hasTabBar={false}
        scrollable
        contentContainerStyle={styles.screen}
        testID="report-issue-screen"
      >
        <SupportPageHeader
          onBack={
            reportStep === 2
              ? () => setReportStep(1)
              : () => backOrReplace(router, '/support')
          }
          title={
            isFeedback
              ? t('fullAuth.report_issue.share_feedback')
              : t('fullAuth.report_issue.report_an_issue')
          }
        />
        <View style={styles.stepHeading}>
          {/* No step counter on the first screen: there is nothing to be
              relative to yet, and the top bar already names the task. */}
          {reportStep === 2 ? (
            <Text style={styles.stepCue}>
              {t('fullAuth.report_issue.last_step')}
            </Text>
          ) : null}
          <Text accessibilityRole="header" style={styles.stepTitle}>
            {reportStep === 1
              ? isFeedback
                ? t('fullAuth.residual.report.feedback_heading')
                : t('fullAuth.residual.report.issue_heading')
              : t('fullAuth.residual.report.check_heading')}
          </Text>
          <Text style={styles.description}>
            {reportStep === 1
              ? isFeedback
                ? t('fullAuth.residual.report.feedback_description')
                : t('fullAuth.residual.report.issue_description')
              : t('fullAuth.residual.report.check_description')}
          </Text>
        </View>

        {reportNotice ? (
          <AppInlineNotice
            description={reportNotice.description}
            testID="report-issue-notice"
            title={reportNotice.title}
            tone={reportNotice.tone}
          />
        ) : null}

        {reportStep === 1 ? (
          <>
            <View style={styles.fields}>
              {isFeedback ? (
                <View style={styles.feedbackReasons}>
                  <Text style={styles.automaticTitle}>
                    What would you like to share?
                  </Text>
                  <View style={styles.reasonChoices}>
                    {FEEDBACK_REASONS.map(reason => (
                      <AppChoiceChip
                        key={reason.id}
                        label={reason.label}
                        selected={title === reason.label}
                        onPress={() => {
                          updateField(setTitle, reason.label);
                          trackProductEvent('Feedback Journey', {
                            action: 'reason_selected',
                            source: 'feedback_form',
                            reason: reason.id,
                          });
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <AppTextField
                  accessibilityLabel={t(
                    'fullAuth.report_issue.short_title_required'
                  )}
                  containerStyle={styles.field}
                  editable
                  helperText={characterCount(title, 200)}
                  label={t('fullAuth.report_issue.short_title')}
                  maxLength={200}
                  onChangeText={value => updateField(setTitle, value)}
                  placeholder={
                    isFeedback
                      ? t('fullAuth.report_issue.what_i_would_change')
                      : t('fullAuth.report_issue.proof_upload_gets_stuck')
                  }
                  testID="report-title-field"
                  value={title}
                />
              )}
              <AppTextArea
                accessibilityLabel={
                  isFeedback
                    ? t('fullAuth.report_issue.feedback_required')
                    : t('fullAuth.report_issue.what_happened_required')
                }
                containerStyle={styles.field}
                editable
                helperText={characterCount(description, 1000)}
                inputStyle={[
                  styles.primaryTextArea,
                  isFeedback && styles.feedbackTextArea,
                ]}
                label={
                  isFeedback
                    ? t('fullAuth.report_issue.your_feedback')
                    : t('fullAuth.report_issue.what_happened')
                }
                maxLength={1000}
                numberOfLines={8}
                onChangeText={value => updateField(setDescription, value)}
                placeholder={
                  isFeedback
                    ? t(
                        'fullAuth.report_issue.what_would_you_like_the_menta_team_to_know'
                      )
                    : t(
                        'fullAuth.report_issue.what_were_you_doing_and_what_did_menta_show'
                      )
                }
                testID="report-description-field"
                textAlignVertical="top"
                value={description}
              />
              {!isContentReport ? (
                showScreenshotOptions ? (
                  <View style={styles.screenshotField}>
                    <Text style={styles.automaticTitle}>
                      {t('fullAuth.report_issue.screenshot_optional')}
                    </Text>
                    {retainedAttachments[0]?.localUri ? (
                      <Image
                        accessibilityLabel={t(
                          'fullAuth.report_issue.selected_support_screenshot'
                        )}
                        resizeMode="cover"
                        source={{ uri: retainedAttachments[0].localUri }}
                        style={styles.screenshotPreview}
                        testID="report-screenshot-preview"
                      />
                    ) : (
                      <Text style={styles.contextCopy}>
                        {isFeedback
                          ? t('fullAuth.residual.report.screenshot_feedback')
                          : t('fullAuth.residual.report.screenshot_issue')}
                      </Text>
                    )}
                    <View style={styles.screenshotActions}>
                      <AppButton
                        disabled={isChoosingScreenshot || isSubmitting}
                        loading={isChoosingScreenshot}
                        onPress={() => void chooseScreenshot()}
                        testID="report-choose-screenshot"
                        title={
                          retainedAttachments.length > 0
                            ? t('fullAuth.report_issue.replace_screenshot')
                            : t('fullAuth.report_issue.choose_screenshot')
                        }
                        variant="secondary"
                      />
                      {retainedAttachments.length > 0 ? (
                        <AppButton
                          disabled={isSubmitting}
                          onPress={() => {
                            setRetainedAttachments([]);
                            setShowScreenshotOptions(false);
                          }}
                          testID="report-remove-screenshot"
                          title={t('fullAuth.report_issue.remove')}
                          variant="ghost"
                        />
                      ) : null}
                    </View>
                  </View>
                ) : (
                  <AppButton
                    fullWidth
                    onPress={() => {
                      setShowScreenshotOptions(true);
                      void chooseScreenshot();
                    }}
                    testID="report-show-screenshot"
                    title={t('fullAuth.report_issue.add_a_screenshot')}
                    variant="ghost"
                  />
                )
              ) : null}
            </View>
            <View style={styles.actions}>
              <AppButton
                disabled={!title.trim() || !description.trim()}
                fullWidth
                onPress={reviewReport}
                size="large"
                testID="review-report"
                title={
                  isFeedback
                    ? t('fullAuth.report_issue.review_feedback')
                    : t('fullAuth.report_issue.review_report')
                }
                variant="accent"
              />
            </View>
            <Text style={styles.submitHelper}>
              {t(
                'fullAuth.report_issue.your_draft_stays_on_this_phone_until_you_send_it'
              )}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.reviewSummary} testID="report-review-summary">
              <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>
                  {t('fullAuth.report_issue.short_title')}
                </Text>
                <Text style={styles.summaryTitle}>{title.trim()}</Text>
              </View>
              <AppDivider muted />
              <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>
                  {isFeedback
                    ? t('fullAuth.residual.report.feedback_label')
                    : t('fullAuth.residual.report.what_happened_label')}
                </Text>
                <Text style={styles.summaryBody}>{description.trim()}</Text>
              </View>
            </View>

            {!isFeedback ? (
              showOptionalDetails ? (
                <View style={styles.optionalFields}>
                  <AppTextArea
                    accessibilityLabel={t(
                      'fullAuth.report_issue.expected_result_optional'
                    )}
                    containerStyle={styles.field}
                    editable
                    helperText={characterCount(expectedBehavior, 500)}
                    label={t(
                      'fullAuth.report_issue.expected_result_optional_2'
                    )}
                    maxLength={500}
                    numberOfLines={3}
                    onChangeText={value =>
                      updateField(setExpectedBehavior, value)
                    }
                    placeholder={t(
                      'fullAuth.report_issue.what_did_you_expect_menta_to_do'
                    )}
                    testID="report-expected-field"
                    textAlignVertical="top"
                    value={expectedBehavior}
                  />
                  <AppTextArea
                    accessibilityLabel={t(
                      'fullAuth.report_issue.steps_to_reproduce_optional'
                    )}
                    containerStyle={styles.field}
                    editable
                    helperText={characterCount(stepsToReproduce, 1000)}
                    label={t(
                      'fullAuth.report_issue.steps_to_reproduce_optional_2'
                    )}
                    maxLength={1000}
                    numberOfLines={4}
                    onChangeText={value =>
                      updateField(setStepsToReproduce, value)
                    }
                    placeholder={t(
                      'fullAuth.report_issue.1_open_2_tap_3_notice'
                    )}
                    testID="report-steps-field"
                    textAlignVertical="top"
                    value={stepsToReproduce}
                  />
                </View>
              ) : (
                <AppButton
                  fullWidth
                  onPress={() => setShowOptionalDetails(true)}
                  testID="report-show-optional-details"
                  title={t('fullAuth.report_issue.add_more_detail')}
                  variant="ghost"
                />
              )
            ) : null}

            <View style={styles.automaticFacts}>
              <Text style={styles.automaticTitle}>
                {isFeedback
                  ? t('fullAuth.residual.report.included_feedback')
                  : t('fullAuth.residual.report.included_report')}
              </Text>
              <Text style={styles.contextCopy}>
                {isFeedback
                  ? t('fullAuth.residual.report.message_label')
                  : t('fullAuth.residual.report.report_label')}{' '}
                {t('fullAuth.report_issue.type')} {categoryLabel}
                {t(
                  'fullAuth.report_issue.this_comes_from_where_you_opened'
                )}{' '}
                {isFeedback
                  ? t('fullAuth.residual.report.form_label')
                  : t('fullAuth.residual.report.report_context_label')}
                .
              </Text>
              {isContextualReport ? (
                <Text style={styles.contextCopy}>
                  {t(
                    'fullAuth.report_issue.menta_includes_the_item_or_screen_you_reported'
                  )}
                </Text>
              ) : null}
              {activeCrashReference ? (
                <Text style={styles.contextCopy}>
                  {t('fullAuth.report_issue.crash_reference')}{' '}
                  {activeCrashReference}{' '}
                  {t('fullAuth.report_issue.will_help_support_find_the_error')}
                </Text>
              ) : null}
              <Text style={styles.contextCopy}>
                {isFeedback
                  ? 'Your feedback and any screenshot you choose go privately to the Menta team.'
                  : t(
                      'fullAuth.report_issue.menta_does_not_add_device_diagnostics_to_this_re'
                    )}
              </Text>
              {retainedAttachments.length > 0 ? (
                <Text style={styles.contextCopy}>
                  {t(
                    'fullAuth.report_issue.your_screenshot_will_be_sent_with_the_report_onl'
                  )}
                </Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              <AppButton
                disabled={isSubmitting || !title.trim() || !description.trim()}
                fullWidth
                loading={isSubmitting}
                onPress={handleSubmit}
                size="large"
                testID="send-report"
                title={
                  activeDraft.status === 'result-unknown'
                    ? t('fullAuth.report_issue.retry_sending_report')
                    : isFeedback
                      ? t('fullAuth.report_issue.send_feedback')
                      : t('fullAuth.report_issue.send_report')
                }
                variant="accent"
              />
            </View>
            {activeDraft.serverReceiptId ? (
              <Text style={styles.receiptReference}>
                {t('fullAuth.report_issue.support_reference')}{' '}
                {activeDraft.serverReceiptId}
              </Text>
            ) : null}
            <Text style={styles.submitHelper}>
              {isFeedback
                ? 'Send when you are ready. You can go back and change anything.'
                : t(
                    'fullAuth.report_issue.we_ll_show_a_support_reference_only_after_the_re'
                  )}
            </Text>
          </>
        )}
      </AppScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: { flex: 1 },
  screen: {
    alignSelf: 'center',
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[12],
    paddingTop: mentaSpacing[6],
    width: '100%',
  },
  draftSkeleton: { gap: mentaSpacing[3], paddingTop: mentaSpacing[4] },
  description: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
  stepHeading: { gap: mentaSpacing[2] },
  stepCue: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmallMedium,
  },
  stepTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.heading,
  },
  contextCopy: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmall,
  },
  fields: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: mentaSpacing[4],
  },
  field: { marginBottom: mentaSpacing[4] },
  primaryTextArea: { minHeight: 160 },
  feedbackTextArea: { minHeight: 200, fontSize: 20, lineHeight: 29 },
  feedbackReasons: { gap: mentaSpacing[3], marginBottom: mentaSpacing[6] },
  reasonChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[2],
  },
  screenshotField: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    paddingTop: mentaSpacing[4],
  },
  screenshotPreview: {
    aspectRatio: 16 / 10,
    borderRadius: mentaRadii.medium,
    width: '100%',
  },
  screenshotActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[2],
  },
  reviewSummary: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  summarySection: { gap: mentaSpacing[1], paddingVertical: mentaSpacing[4] },
  summaryLabel: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  summaryTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  summaryBody: {
    color: mentaColors.text.primary,
    ...mentaTypography.body,
  },
  optionalFields: { gap: mentaSpacing[2], paddingTop: mentaSpacing[2] },
  automaticFacts: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    paddingTop: mentaSpacing[4],
  },
  automaticTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySmallMedium,
  },
  actions: { gap: mentaSpacing[3], paddingTop: mentaSpacing[2] },
  submitHelper: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  receiptReference: {
    color: mentaColors.success,
    ...mentaTypography.bodySmallMedium,
  },
  receiptScreen: {
    alignSelf: 'center',
    flex: 1,
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[12],
    paddingTop: mentaSpacing[6],
    width: '100%',
  },
  receiptBody: {
    alignItems: 'center',
    flex: 1,
    gap: 18,
    justifyContent: 'center',
  },
  receiptCopy: { alignItems: 'center', gap: mentaSpacing[2], width: '100%' },
  receiptDescription: {
    color: mentaColors.text.secondary,
    textAlign: 'center',
    width: '100%',
    ...mentaTypography.body,
  },
  receiptCard: { gap: mentaSpacing[2], width: '100%' },
  receiptStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  receiptStatus: {
    color: mentaColors.success,
    ...mentaTypography.caption,
    fontWeight: '600',
  },
  receiptCardCopy: {
    color: mentaColors.text.primary,
    flexShrink: 1,
    ...mentaTypography.caption,
  },
  receiptFooter: { gap: mentaSpacing[2] },
});
