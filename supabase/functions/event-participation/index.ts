import { corsHeaders } from '../_shared/cors.ts';
import {
  buildFunctionContext,
  jsonResponse,
  readJsonBody,
  sha256Hex,
} from '../_shared/security.ts';
import {
  canonicalCommandForHash,
  isUuid,
  parseEventFunctionCommand,
  type EventFunctionAction,
  type EventFunctionCommand,
} from './contracts.ts';
import { isOwnedEventMediaPath, parseEventMediaPath } from './storage-paths.ts';

type UnknownRecord = Record<string, unknown>;

type ReceiptOutcome = 'completed' | 'failed' | 'unknown_result';

type EdgeReceipt = {
  action: EventFunctionAction;
  outcome: ReceiptOutcome;
  code: string;
  message: string;
  clientEventId: string | null;
  data: unknown;
  retryable: boolean;
  idempotent: boolean;
};

type RpcReceiptAction =
  | EventFunctionAction
  | 'prepare_post_delete'
  | 'complete_post_delete';

type EventFunctionContext = Awaited<ReturnType<typeof buildFunctionContext>>;

const EVENT_MEDIA_BUCKET = 'event-media';

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isReceiptOutcome = (value: unknown): value is ReceiptOutcome =>
  value === 'completed' || value === 'failed' || value === 'unknown_result';

const failedReceipt = (
  action: EventFunctionAction,
  clientEventId: string | null,
  code: string,
  message: string
): EdgeReceipt => ({
  action,
  outcome: 'failed',
  code,
  message,
  clientEventId,
  data: null,
  retryable: false,
  idempotent: false,
});

/**
 * An RPC or Storage call may have committed just before a connection failure.
 * Never turn that ambiguity into a failed receipt or an optimistic UI state.
 */
const unknownReceipt = (
  action: EventFunctionAction,
  clientEventId: string | null,
  code: string,
  message: string
): EdgeReceipt => ({
  action,
  outcome: 'unknown_result',
  code,
  message,
  clientEventId,
  data: null,
  retryable: true,
  idempotent: false,
});

const receiptResponse = (receipt: EdgeReceipt): Response =>
  jsonResponse({ receipt });

const requiresAuthentication = (action: EventFunctionAction): boolean =>
  action !== 'list_public_events' && action !== 'get_event_summary';

const clientEventIdFor = (command: EventFunctionCommand): string | null =>
  'clientEventId' in command ? command.clientEventId : null;

const normaliseRpcReceipt = (
  value: unknown,
  expectedAction: EventFunctionAction,
  expectedClientEventId: string | null,
  expectedRpcAction: RpcReceiptAction = expectedAction
): EdgeReceipt | null => {
  if (
    !isRecord(value) ||
    typeof value.action !== 'string' ||
    !isReceiptOutcome(value.outcome) ||
    typeof value.code !== 'string' ||
    typeof value.message !== 'string' ||
    (value.clientEventId !== null && typeof value.clientEventId !== 'string') ||
    typeof value.retryable !== 'boolean' ||
    typeof value.idempotent !== 'boolean'
  ) {
    return null;
  }

  if (
    value.action !== expectedRpcAction ||
    value.clientEventId !== expectedClientEventId
  ) {
    return null;
  }

  return {
    action: expectedAction,
    outcome: value.outcome,
    code: value.code,
    message: value.message,
    clientEventId: expectedClientEventId,
    data: 'data' in value ? value.data : null,
    retryable: value.retryable,
    idempotent: value.idempotent,
  };
};

const callRpc = async (
  context: EventFunctionContext,
  rpc: string,
  args: UnknownRecord,
  action: EventFunctionAction,
  clientEventId: string | null,
  expectedRpcAction: RpcReceiptAction = action
): Promise<EdgeReceipt> => {
  try {
    const { data, error } = await context.serviceClient.rpc(rpc, args);
    if (error) {
      console.error('[event-participation] RPC failed', {
        rpc,
        message: error.message,
      });
      return unknownReceipt(
        action,
        clientEventId,
        'EVENT_RPC_UNCONFIRMED',
        'We could not confirm the event action. Check its status before retrying.'
      );
    }

    const receipt = normaliseRpcReceipt(
      data as unknown,
      action,
      clientEventId,
      expectedRpcAction
    );
    if (!receipt) {
      console.error('[event-participation] RPC returned an invalid receipt', {
        rpc,
      });
      return unknownReceipt(
        action,
        clientEventId,
        'EVENT_RPC_RECEIPT_INVALID',
        'We could not verify the event receipt. Check its status before retrying.'
      );
    }

    return receipt;
  } catch (error) {
    console.error('[event-participation] RPC transport failed', { rpc, error });
    return unknownReceipt(
      action,
      clientEventId,
      'EVENT_RPC_UNCONFIRMED',
      'We could not confirm the event action. Check its status before retrying.'
    );
  }
};

/**
 * Event occurrence state is derived from database time, never from a device.
 * Reconcile before every valid app command so reads and mutations observe the
 * same scheduled -> live -> ended lifecycle even when no cron worker runs.
 */
const reconcileOccurrenceLifecycle = async (
  context: EventFunctionContext,
  action: EventFunctionAction,
  clientEventId: string | null
): Promise<EdgeReceipt | null> => {
  try {
    const { data, error } = await context.serviceClient.rpc(
      'event_reconcile_occurrence_lifecycle_v1'
    );
    if (
      error ||
      typeof data !== 'number' ||
      !Number.isSafeInteger(data) ||
      data < 0
    ) {
      console.error('[event-participation] lifecycle reconciliation failed', {
        message: error?.message ?? 'Invalid transition count',
      });
      return unknownReceipt(
        action,
        clientEventId,
        'EVENT_LIFECYCLE_UNCONFIRMED',
        'We could not confirm the current event state. Try again before continuing.'
      );
    }

    return null;
  } catch (error) {
    console.error('[event-participation] lifecycle reconciliation failed', {
      error,
    });
    return unknownReceipt(
      action,
      clientEventId,
      'EVENT_LIFECYCLE_UNCONFIRMED',
      'We could not confirm the current event state. Try again before continuing.'
    );
  }
};

/**
 * This is intentionally separate from the service-role RPC helper. The
 * Private album, review, and recap reads derive eligibility from auth.uid()
 * in Postgres, so they must retain the caller's JWT all the way to the
 * database.
 */
const callUserRpc = async (
  context: EventFunctionContext,
  rpc: string,
  args: UnknownRecord,
  action: EventFunctionAction
): Promise<EdgeReceipt> => {
  try {
    const { data, error } = await context.userClient.rpc(rpc, args);
    if (error) {
      console.error('[event-participation] user RPC failed', {
        rpc,
        message: error.message,
      });
      return unknownReceipt(
        action,
        null,
        'EVENT_RPC_UNCONFIRMED',
        'We could not confirm the event action. Check its status before retrying.'
      );
    }

    const receipt = normaliseRpcReceipt(data as unknown, action, null);
    if (!receipt) {
      console.error(
        '[event-participation] user RPC returned an invalid receipt',
        {
          rpc,
        }
      );
      return unknownReceipt(
        action,
        null,
        'EVENT_RPC_RECEIPT_INVALID',
        'We could not verify the event receipt. Check its status before retrying.'
      );
    }

    return receipt;
  } catch (error) {
    console.error('[event-participation] user RPC transport failed', {
      rpc,
      error,
    });
    return unknownReceipt(
      action,
      null,
      'EVENT_RPC_UNCONFIRMED',
      'We could not confirm the event action. Check its status before retrying.'
    );
  }
};

type SignedMediaItem = UnknownRecord & {
  postId: string;
  occurrenceId: string;
};

type SignedMediaData = {
  occurrenceId: string;
  items: SignedMediaItem[];
};

type SignedMediaOptions = {
  itemKey: 'items' | 'albumItems';
  expectedOccurrenceId?: string;
  expectedStatus: 'pending_review' | 'approved';
  maximumItems: number;
  failureCode:
    | 'ORGANISER_PREVIEW_UNCONFIRMED'
    | 'ATTENDEE_ALBUM_UNCONFIRMED'
    | 'ORGANISER_RECAP_UNCONFIRMED';
  failureMessage: string;
};

const parseSignedMediaData = (
  value: unknown,
  options: SignedMediaOptions
): SignedMediaData | null => {
  if (
    !isRecord(value) ||
    !isUuid(value.occurrenceId) ||
    (options.expectedOccurrenceId !== undefined &&
      value.occurrenceId !== options.expectedOccurrenceId)
  ) {
    return null;
  }

  const rawItems = value[options.itemKey];
  if (!Array.isArray(rawItems) || rawItems.length > options.maximumItems) {
    return null;
  }

  const itemIds = new Set<string>();
  for (const item of rawItems) {
    if (
      !isRecord(item) ||
      !isUuid(item.postId) ||
      item.occurrenceId !== value.occurrenceId ||
      'mediaPath' in item ||
      'storagePath' in item ||
      'uploadToken' in item ||
      itemIds.has(item.postId)
    ) {
      return null;
    }
    itemIds.add(item.postId);
  }

  return {
    occurrenceId: value.occurrenceId,
    items: rawItems as SignedMediaItem[],
  };
};

/**
 * SQL read receipts are deliberately path-free. Once an auth.uid-scoped RPC
 * proves access, this Edge-only step resolves exactly the returned post IDs
 * and converts their canonical private paths into one-minute view
 * capabilities. A partial lookup or signing result fails the whole read;
 * missing media can never be mistaken for a confirmed empty album/queue.
 */
const attachSignedMediaPreviews = async (
  context: EventFunctionContext,
  receipt: EdgeReceipt,
  options: SignedMediaOptions
): Promise<EdgeReceipt> => {
  if (receipt.outcome !== 'completed') return receipt;

  const media = parseSignedMediaData(receipt.data, options);
  if (!media) {
    return unknownReceipt(
      receipt.action,
      null,
      options.failureCode,
      options.failureMessage
    );
  }
  if (media.items.length === 0) return receipt;

  const postIds = media.items.map(item => item.postId);
  try {
    const { data, error } = await context.serviceClient
      .from('event_posts')
      .select('id, occurrence_id, user_id, media_path, status, reviewed_at')
      .in('id', postIds)
      .eq('occurrence_id', media.occurrenceId)
      .eq('status', options.expectedStatus);
    if (error || !data || data.length !== postIds.length) {
      if (error) {
        console.error('[event-participation] private media lookup failed', {
          message: error.message,
        });
      }
      return unknownReceipt(
        receipt.action,
        null,
        options.failureCode,
        options.failureMessage
      );
    }

    const pathsByPostId = new Map<string, string>();
    for (const row of data) {
      const parsedPath = parseEventMediaPath(row.media_path);
      if (
        typeof row.id !== 'string' ||
        row.occurrence_id !== media.occurrenceId ||
        row.status !== options.expectedStatus ||
        (options.expectedStatus === 'approved' &&
          typeof row.reviewed_at !== 'string') ||
        !parsedPath ||
        parsedPath.postId !== row.id ||
        parsedPath.occurrenceId !== media.occurrenceId ||
        parsedPath.ownerId !== row.user_id ||
        pathsByPostId.has(row.id)
      ) {
        return unknownReceipt(
          receipt.action,
          null,
          options.failureCode,
          options.failureMessage
        );
      }
      pathsByPostId.set(row.id, row.media_path);
    }

    if (pathsByPostId.size !== postIds.length) {
      return unknownReceipt(
        receipt.action,
        null,
        options.failureCode,
        options.failureMessage
      );
    }

    const paths: string[] = [];
    for (const postId of postIds) {
      const path = pathsByPostId.get(postId);
      if (!path) {
        return unknownReceipt(
          receipt.action,
          null,
          options.failureCode,
          options.failureMessage
        );
      }
      paths.push(path);
    }

    const { data: signed, error: signedError } =
      await context.serviceClient.storage
        .from(EVENT_MEDIA_BUCKET)
        .createSignedUrls(paths, 60);
    if (signedError || !signed || signed.length !== paths.length) {
      if (signedError) {
        console.error('[event-participation] private media signing failed', {
          message: signedError.message,
        });
      }
      return unknownReceipt(
        receipt.action,
        null,
        options.failureCode,
        options.failureMessage
      );
    }

    const urlsByPath = new Map<string, string>();
    for (const result of signed) {
      if (
        result.error ||
        typeof result.path !== 'string' ||
        typeof result.signedUrl !== 'string' ||
        !result.signedUrl.startsWith('https://') ||
        urlsByPath.has(result.path)
      ) {
        return unknownReceipt(
          receipt.action,
          null,
          options.failureCode,
          options.failureMessage
        );
      }
      urlsByPath.set(result.path, result.signedUrl);
    }

    const itemsWithPreviews: Array<
      SignedMediaItem & { mediaPreviewUrl: string }
    > = [];
    for (const item of media.items) {
      const path = pathsByPostId.get(item.postId);
      const mediaPreviewUrl = path ? urlsByPath.get(path) : null;
      if (!mediaPreviewUrl) {
        return unknownReceipt(
          receipt.action,
          null,
          options.failureCode,
          options.failureMessage
        );
      }
      itemsWithPreviews.push({ ...item, mediaPreviewUrl });
    }

    return {
      ...receipt,
      data: {
        ...(receipt.data as UnknownRecord),
        [options.itemKey]: itemsWithPreviews.map(item => ({
          ...item,
          mediaPreviewExpiresInSeconds: 60,
        })),
      },
    };
  } catch (error) {
    console.error('[event-participation] private media transport failed', {
      error,
    });
    return unknownReceipt(
      receipt.action,
      null,
      options.failureCode,
      options.failureMessage
    );
  }
};

const attachOrganiserQueuePreviews = (
  context: EventFunctionContext,
  receipt: EdgeReceipt,
  occurrenceId: string
): Promise<EdgeReceipt> =>
  attachSignedMediaPreviews(context, receipt, {
    itemKey: 'items',
    expectedOccurrenceId: occurrenceId,
    expectedStatus: 'pending_review',
    maximumItems: 100,
    failureCode: 'ORGANISER_PREVIEW_UNCONFIRMED',
    failureMessage:
      'We could not confirm every private photo preview. No review decision was enabled.',
  });

const attachAttendeeAlbumPreviews = (
  context: EventFunctionContext,
  receipt: EdgeReceipt,
  occurrenceId: string
): Promise<EdgeReceipt> =>
  attachSignedMediaPreviews(context, receipt, {
    itemKey: 'items',
    expectedOccurrenceId: occurrenceId,
    expectedStatus: 'approved',
    maximumItems: 24,
    failureCode: 'ATTENDEE_ALBUM_UNCONFIRMED',
    failureMessage:
      'We could not confirm every approved event photo. The album was not reported as empty.',
  });

const attachOrganiserRecapPreviews = (
  context: EventFunctionContext,
  receipt: EdgeReceipt
): Promise<EdgeReceipt> =>
  attachSignedMediaPreviews(context, receipt, {
    itemKey: 'albumItems',
    expectedStatus: 'approved',
    maximumItems: 12,
    failureCode: 'ORGANISER_RECAP_UNCONFIRMED',
    failureMessage:
      'We could not confirm every approved recap photo. The recap was not reported as complete.',
  });

const hashCommandForActor = async (
  actorId: string,
  command: EventFunctionCommand
): Promise<string> =>
  await sha256Hex(`${actorId}\n${canonicalCommandForHash(command)}`);

const hashOptionalToken = async (
  token: string | null
): Promise<string | null> => (token === null ? null : await sha256Hex(token));

type UploadPreparation = {
  postId: string;
  occurrenceId: string;
  storagePath: string;
  contentType: string;
  byteSize: number;
};

const parseUploadPreparation = (value: unknown): UploadPreparation | null => {
  if (
    !isRecord(value) ||
    typeof value.postId !== 'string' ||
    typeof value.occurrenceId !== 'string' ||
    typeof value.storagePath !== 'string' ||
    typeof value.contentType !== 'string' ||
    typeof value.byteSize !== 'number' ||
    !Number.isInteger(value.byteSize)
  ) {
    return null;
  }

  return {
    postId: value.postId,
    occurrenceId: value.occurrenceId,
    storagePath: value.storagePath,
    contentType: value.contentType,
    byteSize: value.byteSize,
  };
};

type DeletePreparation = {
  postId: string;
  occurrenceId: string;
  storagePath: string;
};

const parseDeletePreparation = (value: unknown): DeletePreparation | null => {
  if (
    !isRecord(value) ||
    typeof value.postId !== 'string' ||
    typeof value.occurrenceId !== 'string' ||
    typeof value.storagePath !== 'string'
  ) {
    return null;
  }

  return {
    postId: value.postId,
    occurrenceId: value.occurrenceId,
    storagePath: value.storagePath,
  };
};

const prepareEventUpload = async (
  context: EventFunctionContext,
  command: Extract<EventFunctionCommand, { action: 'prepare_post_upload' }>,
  requestHash: string
): Promise<EdgeReceipt> => {
  const receipt = await callRpc(
    context,
    'event_prepare_post_upload_v1',
    {
      p_actor_id: context.user?.id,
      p_occurrence_id: command.occurrenceId,
      p_client_event_id: command.clientEventId,
      p_request_hash: requestHash,
      p_caption: command.caption,
      p_content_type: command.contentType,
      p_byte_size: command.byteSize,
    },
    command.action,
    command.clientEventId
  );

  if (receipt.outcome !== 'completed') return receipt;

  const preparation = parseUploadPreparation(receipt.data);
  if (
    !preparation ||
    preparation.occurrenceId !== command.occurrenceId ||
    preparation.contentType !== command.contentType ||
    preparation.byteSize !== command.byteSize ||
    !context.user ||
    !isOwnedEventMediaPath(
      preparation.storagePath,
      context.user.id,
      preparation.occurrenceId,
      preparation.postId
    )
  ) {
    console.error('[event-participation] invalid server upload preparation');
    return unknownReceipt(
      command.action,
      command.clientEventId,
      'UPLOAD_CAPABILITY_UNCONFIRMED',
      'We could not verify the secure upload capability. Check the saved photo before retrying.'
    );
  }

  try {
    const { data, error } = await context.serviceClient.storage
      .from(EVENT_MEDIA_BUCKET)
      .createSignedUploadUrl(preparation.storagePath, { upsert: false });

    if (
      error ||
      !data ||
      data.path !== preparation.storagePath ||
      typeof data.token !== 'string' ||
      data.token.length === 0
    ) {
      if (error) {
        console.error('[event-participation] upload capability failed', {
          message: error.message,
        });
      }
      return unknownReceipt(
        command.action,
        command.clientEventId,
        'UPLOAD_CAPABILITY_UNCONFIRMED',
        'We could not create a confirmed upload capability. Check the saved photo before retrying.'
      );
    }

    return {
      ...receipt,
      data: {
        ...preparation,
        uploadToken: data.token,
        // The Storage SDK documents the token window but does not return a
        // machine-readable expiry. The client must not make up a date.
        expiresAt: null,
      },
    };
  } catch (error) {
    console.error('[event-participation] upload capability transport failed', {
      error,
    });
    return unknownReceipt(
      command.action,
      command.clientEventId,
      'UPLOAD_CAPABILITY_UNCONFIRMED',
      'We could not create a confirmed upload capability. Check the saved photo before retrying.'
    );
  }
};

const deleteEventPost = async (
  context: EventFunctionContext,
  command: Extract<EventFunctionCommand, { action: 'delete_own_post' }>,
  requestHash: string
): Promise<EdgeReceipt> => {
  const preparation = await callRpc(
    context,
    'event_prepare_post_delete_v1',
    {
      p_actor_id: context.user?.id,
      p_post_id: command.postId,
      p_client_event_id: command.clientEventId,
      p_request_hash: requestHash,
    },
    command.action,
    command.clientEventId,
    'prepare_post_delete'
  );

  if (preparation.outcome !== 'completed') return preparation;

  if (preparation.code === 'ALREADY_DELETED') {
    return preparation;
  }

  const data = parseDeletePreparation(preparation.data);
  if (
    !data ||
    data.postId !== command.postId ||
    !context.user ||
    !isOwnedEventMediaPath(
      data.storagePath,
      context.user.id,
      data.occurrenceId,
      data.postId
    )
  ) {
    console.error('[event-participation] invalid server deletion preparation');
    return unknownReceipt(
      command.action,
      command.clientEventId,
      'DELETE_CAPABILITY_UNCONFIRMED',
      'We could not verify the secure deletion target. Check the post before retrying.'
    );
  }

  try {
    const { data: removed, error: removeError } =
      await context.serviceClient.storage
        .from(EVENT_MEDIA_BUCKET)
        .remove([data.storagePath]);
    if (removeError || !removed) {
      if (removeError) {
        console.error('[event-participation] event media removal failed', {
          message: removeError.message,
        });
      }
      return unknownReceipt(
        command.action,
        command.clientEventId,
        'DELETE_STORAGE_UNCONFIRMED',
        'We could not confirm secure media deletion. Check the post before retrying.'
      );
    }
  } catch (error) {
    console.error(
      '[event-participation] event media removal transport failed',
      {
        error,
      }
    );
    return unknownReceipt(
      command.action,
      command.clientEventId,
      'DELETE_STORAGE_UNCONFIRMED',
      'We could not confirm secure media deletion. Check the post before retrying.'
    );
  }

  return callRpc(
    context,
    'event_complete_post_delete_v1',
    {
      p_actor_id: context.user?.id,
      p_post_id: command.postId,
      p_client_event_id: command.clientEventId,
      p_request_hash: requestHash,
    },
    command.action,
    command.clientEventId,
    'complete_post_delete'
  );
};

const executeCommand = async (
  context: EventFunctionContext,
  command: EventFunctionCommand
): Promise<EdgeReceipt> => {
  const clientEventId = clientEventIdFor(command);

  if (requiresAuthentication(command.action) && !context.user) {
    return failedReceipt(
      command.action,
      clientEventId,
      'AUTHENTICATION_REQUIRED',
      'Sign in before using event participation.'
    );
  }

  const lifecycleFailure = await reconcileOccurrenceLifecycle(
    context,
    command.action,
    clientEventId
  );
  if (lifecycleFailure) return lifecycleFailure;

  if (command.action === 'get_event_summary') {
    const [shareTokenHash, inviteTokenHash] = await Promise.all([
      hashOptionalToken(command.shareToken),
      hashOptionalToken(command.inviteToken),
    ]);
    return callRpc(
      context,
      'event_get_invite_entry_summary_v2',
      {
        p_event_id: command.eventId,
        p_actor_id: context.user?.id ?? null,
        p_share_token_hash: shareTokenHash,
        p_invite_token_hash: inviteTokenHash,
      },
      command.action,
      null
    );
  }

  if (command.action === 'list_public_events') {
    return callRpc(
      context,
      'event_list_public_summaries_v1',
      {},
      command.action,
      null
    );
  }

  if (!context.user) {
    return failedReceipt(
      command.action,
      clientEventId,
      'AUTHENTICATION_REQUIRED',
      'Sign in before using event participation.'
    );
  }

  if (command.action === 'get_organiser_review_queue') {
    const queueReceipt = await callUserRpc(
      context,
      'event_get_organiser_review_queue_v1',
      {
        p_occurrence_id: command.occurrenceId,
      },
      command.action
    );
    return attachOrganiserQueuePreviews(
      context,
      queueReceipt,
      command.occurrenceId
    );
  }

  if (command.action === 'get_attendee_album') {
    const albumReceipt = await callUserRpc(
      context,
      'event_get_attendee_album_v1',
      {
        p_occurrence_id: command.occurrenceId,
      },
      command.action
    );
    return attachAttendeeAlbumPreviews(
      context,
      albumReceipt,
      command.occurrenceId
    );
  }

  if (command.action === 'get_organiser_recap') {
    const recapReceipt = await callUserRpc(
      context,
      'event_get_organiser_recap_v1',
      {
        p_event_id: command.eventId,
      },
      command.action
    );
    return attachOrganiserRecapPreviews(context, recapReceipt);
  }

  const requestHash = await hashCommandForActor(context.user.id, command);

  switch (command.action) {
    case 'create_event': {
      const accessToken =
        command.visibility === 'public' ? null : crypto.randomUUID();
      const checkInToken = crypto.randomUUID();
      return callRpc(
        context,
        'event_create_v1',
        {
          p_actor_id: context.user.id,
          p_client_event_id: command.clientEventId,
          p_request_hash: requestHash,
          p_title: command.title,
          p_description: command.description,
          p_venue_name: command.venueName,
          p_time_zone: command.timeZone,
          p_visibility: command.visibility,
          p_starts_at: command.startsAt,
          p_ends_at: command.endsAt,
          p_capacity: command.capacity,
          p_access_token: accessToken,
          p_access_token_hash: accessToken
            ? await sha256Hex(accessToken)
            : null,
          p_checkin_token: checkInToken,
          p_checkin_token_hash: await sha256Hex(checkInToken),
        },
        command.action,
        command.clientEventId
      );
    }

    case 'get_my_occurrence':
      return callRpc(
        context,
        'event_get_my_occurrence_v1',
        {
          p_actor_id: context.user.id,
          p_occurrence_id: command.occurrenceId,
        },
        command.action,
        null
      );

    case 'join': {
      const [shareTokenHash, inviteTokenHash] = await Promise.all([
        hashOptionalToken(command.shareToken),
        hashOptionalToken(command.inviteToken),
      ]);
      return callRpc(
        context,
        'event_join_invite_entry_v2',
        {
          p_actor_id: context.user.id,
          p_occurrence_id: command.occurrenceId,
          p_client_event_id: command.clientEventId,
          p_request_hash: requestHash,
          p_consent_version: command.consentVersion,
          p_share_token_hash: shareTokenHash,
          p_invite_token_hash: inviteTokenHash,
        },
        command.action,
        command.clientEventId
      );
    }

    case 'leave':
      return callRpc(
        context,
        'event_leave_v1',
        {
          p_actor_id: context.user.id,
          p_occurrence_id: command.occurrenceId,
          p_client_event_id: command.clientEventId,
          p_request_hash: requestHash,
        },
        command.action,
        command.clientEventId
      );

    case 'check_in':
      return callRpc(
        context,
        'event_redeem_checkin_v1',
        {
          p_actor_id: context.user.id,
          p_occurrence_id: command.occurrenceId,
          p_client_event_id: command.clientEventId,
          p_request_hash: requestHash,
          p_token_hash: await sha256Hex(command.token),
        },
        command.action,
        command.clientEventId
      );

    case 'prepare_post_upload':
      return prepareEventUpload(context, command, requestHash);

    case 'finalise_post':
      return callRpc(
        context,
        'event_finalise_post_v1',
        {
          p_actor_id: context.user.id,
          p_post_id: command.postId,
          p_client_event_id: command.clientEventId,
          p_request_hash: requestHash,
        },
        command.action,
        command.clientEventId
      );

    case 'review_post':
      return callRpc(
        context,
        'event_review_post_v1',
        {
          p_actor_id: context.user.id,
          p_post_id: command.postId,
          p_client_event_id: command.clientEventId,
          p_request_hash: requestHash,
          p_expected_revision: command.expectedRevision,
          p_decision: command.decision,
          p_note: command.note,
        },
        command.action,
        command.clientEventId
      );

    case 'delete_own_post':
      return deleteEventPost(context, command, requestHash);
  }
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await readJsonBody<unknown>(req);
  const parsed = parseEventFunctionCommand(body);
  if (!parsed.ok) {
    if (!parsed.action) {
      return jsonResponse(
        {
          receipt: {
            action: 'get_event_summary',
            outcome: 'failed',
            code: parsed.code,
            message: parsed.message,
            clientEventId: null,
            data: null,
            retryable: false,
            idempotent: false,
          },
        },
        400
      );
    }
    return receiptResponse(
      failedReceipt(
        parsed.action,
        parsed.clientEventId,
        parsed.code,
        parsed.message
      )
    );
  }

  try {
    const context = await buildFunctionContext(req);
    return receiptResponse(await executeCommand(context, parsed.command));
  } catch (error) {
    console.error('[event-participation] unexpected failure', { error });
    return receiptResponse(
      unknownReceipt(
        parsed.command.action,
        clientEventIdFor(parsed.command),
        'EVENT_SERVICE_UNCONFIRMED',
        'We could not confirm the event action. Check its status before retrying.'
      )
    );
  }
});
