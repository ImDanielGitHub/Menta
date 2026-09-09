import { corsHeaders } from '../_shared/cors.ts';
import {
  buildFunctionContext,
  consumeRateLimit,
  jsonResponse,
} from '../_shared/security.ts';
import {
  accountStorageDeletionTargets,
  chunkStoragePaths,
  isPathWithinStoragePrefix,
  joinStorageChildPath,
  type AccountStorageDeletionTarget,
} from './media-paths.ts';
import {
  AppleRevocationError,
  appleProviderStateForUser,
  parseAccountDeletionRequest,
  revokeAppleAuthorization,
  type AppleRevocationConfig,
  type AppleRevocationErrorCode,
} from './apple-revocation.ts';
import { deleteOneSignalUser } from './onesignal-user-deletion.ts';
import {
  parseAccountDeletionCommit,
  parseAccountDeletionPreparation,
} from './ownership-guard.ts';

type ServiceClient = Awaited<
  ReturnType<typeof buildFunctionContext>
>['serviceClient'];

type StorageOperationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

type StorageListEntry = {
  name: string;
  id: string | null;
  metadata: unknown | null;
};

const PAGE_SIZE = 100;
const REMOVE_BATCH_SIZE = 100;
const MAX_STORAGE_DEPTH = 12;

const releaseAccountDeletionGuard = async (
  serviceClient: ServiceClient,
  actorId: string,
  clientEventId: string
): Promise<void> => {
  const { error } = await serviceClient.rpc('cancel_account_deletion_v1', {
    p_actor_id: actorId,
    p_client_event_id: clientEventId,
  });

  if (error) {
    console.error('[delete-my-account] Could not release deletion guard', {
      code: error.code,
    });
  }
};

const accountNotDeletedResponse = (
  code: string,
  error: string,
  status: number
): Response =>
  jsonResponse(
    {
      success: false,
      accountDeleted: false,
      recoverable: true,
      code,
      error,
    },
    status
  );

const readAccountDeletionRequest = async (req: Request) => {
  const body = await req.text();
  if (body.trim().length === 0) {
    return parseAccountDeletionRequest(null);
  }

  try {
    return parseAccountDeletionRequest(JSON.parse(body) as unknown);
  } catch {
    return { ok: false } as const;
  }
};

const appleRevocationConfig = (): AppleRevocationConfig => ({
  clientId: Deno.env.get('APPLE_NATIVE_CLIENT_ID') ?? '',
  keyId: Deno.env.get('APPLE_KEY_ID') ?? '',
  privateKey: Deno.env.get('APPLE_PRIVATE_KEY') ?? '',
  teamId: Deno.env.get('APPLE_TEAM_ID') ?? '',
});

const appleRevocationFailureStatus = (
  code: AppleRevocationErrorCode
): number => {
  if (code === 'APPLE_REVOCATION_CONFIGURATION_ERROR') return 503;
  if (
    code === 'APPLE_AUTHORIZATION_INVALID' ||
    code === 'APPLE_AUTHORIZATION_MISMATCH'
  ) {
    return 409;
  }
  return 502;
};

const asStorageListEntry = (value: unknown): StorageListEntry | null => {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('name' in value) ||
    typeof value.name !== 'string'
  ) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  return {
    name: candidate.name as string,
    id: typeof candidate.id === 'string' ? candidate.id : null,
    metadata: candidate.metadata ?? null,
  };
};

const listStoragePaths = async (
  serviceClient: ServiceClient,
  target: AccountStorageDeletionTarget,
  prefix = target.prefix,
  depth = 0
): Promise<StorageOperationResult<string[]>> => {
  if (
    depth > MAX_STORAGE_DEPTH ||
    !isPathWithinStoragePrefix(prefix, target.prefix)
  ) {
    return {
      ok: false,
      message: `Unsafe storage prefix while deleting ${target.bucket}.`,
    };
  }

  const paths: string[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let entries: unknown[];

    try {
      const { data, error } = await serviceClient.storage
        .from(target.bucket)
        .list(prefix, {
          limit: PAGE_SIZE,
          offset,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error || !data) {
        if (error) {
          console.error('[delete-my-account] Storage list failed', {
            bucket: target.bucket,
            prefix,
            message: error.message,
          });
        }
        return { ok: false, message: `Could not list ${target.bucket} media.` };
      }

      entries = data as unknown[];
    } catch (error) {
      console.error('[delete-my-account] Storage list transport failed', {
        bucket: target.bucket,
        prefix,
        error,
      });
      return { ok: false, message: `Could not list ${target.bucket} media.` };
    }

    for (const item of entries) {
      const entry = asStorageListEntry(item);
      if (!entry) {
        return {
          ok: false,
          message: `Received an invalid ${target.bucket} storage entry.`,
        };
      }

      const childPath = joinStorageChildPath(prefix, entry.name);
      if (!childPath || !isPathWithinStoragePrefix(childPath, target.prefix)) {
        return {
          ok: false,
          message: `Received an unsafe ${target.bucket} storage entry.`,
        };
      }

      if (entry.id === null || entry.metadata === null) {
        const nested = await listStoragePaths(
          serviceClient,
          target,
          childPath,
          depth + 1
        );
        if (!nested.ok) return nested;
        paths.push(...nested.data);
      } else {
        paths.push(childPath);
      }
    }

    if (entries.length < PAGE_SIZE) break;
  }

  return { ok: true, data: paths };
};

const removeStoragePaths = async (
  serviceClient: ServiceClient,
  target: AccountStorageDeletionTarget,
  paths: readonly string[]
): Promise<StorageOperationResult<null>> => {
  for (const path of paths) {
    if (!isPathWithinStoragePrefix(path, target.prefix)) {
      return {
        ok: false,
        message: `Refused to remove an unsafe ${target.bucket} storage path.`,
      };
    }
  }

  for (const chunk of chunkStoragePaths(paths, REMOVE_BATCH_SIZE)) {
    try {
      const { data, error } = await serviceClient.storage
        .from(target.bucket)
        .remove(chunk);
      if (error || !data) {
        if (error) {
          console.error('[delete-my-account] Storage remove failed', {
            bucket: target.bucket,
            message: error.message,
          });
        }
        return {
          ok: false,
          message: `Could not remove ${target.bucket} media.`,
        };
      }
    } catch (error) {
      console.error('[delete-my-account] Storage remove transport failed', {
        bucket: target.bucket,
        error,
      });
      return { ok: false, message: `Could not remove ${target.bucket} media.` };
    }
  }

  return { ok: true, data: null };
};

const removeUserStorageObjects = async (
  serviceClient: ServiceClient,
  userId: string
): Promise<StorageOperationResult<null>> => {
  const targets = accountStorageDeletionTargets(userId);
  if (targets.length === 0) {
    return {
      ok: false,
      message: 'The authenticated account identifier is invalid.',
    };
  }

  for (const target of targets) {
    const listed = await listStoragePaths(serviceClient, target);
    if (!listed.ok) return listed;

    const removed = await removeStoragePaths(
      serviceClient,
      target,
      listed.data
    );
    if (!removed.ok) return removed;

    // Storage remove may succeed immediately before a transport failure. List
    // again and refuse to delete the account record until the user namespace
    // is visibly empty, including event-media/v1/<userId>/... objects.
    const remaining = await listStoragePaths(serviceClient, target);
    if (!remaining.ok) return remaining;
    if (remaining.data.length > 0) {
      return {
        ok: false,
        message: `Could not confirm removal of all ${target.bucket} media.`,
      };
    }
  }

  return { ok: true, data: null };
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const context = await buildFunctionContext(req);

    if (!context.user) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    const parsedRequest = await readAccountDeletionRequest(req);
    if (!parsedRequest.ok) {
      return accountNotDeletedResponse(
        'INVALID_REQUEST',
        'The account deletion request was invalid. Nothing was deleted.',
        400
      );
    }

    const appleProvider = appleProviderStateForUser(context.user);
    if (appleProvider.linked && !appleProvider.subject) {
      return accountNotDeletedResponse(
        'APPLE_IDENTITY_UNAVAILABLE',
        'Menta could not confirm the linked Apple account. Nothing was deleted.',
        503
      );
    }

    if (appleProvider.linked && !parsedRequest.request.appleAuthorizationCode) {
      return accountNotDeletedResponse(
        'APPLE_REAUTH_REQUIRED',
        'Sign in with Apple again to revoke Apple access before deletion.',
        428
      );
    }

    const limit = await consumeRateLimit(
      context.serviceClient,
      'delete-my-account',
      context.user.id,
      3,
      60
    );

    if (!limit.allowed) {
      return jsonResponse(
        {
          error: 'Too many account deletion attempts',
          retryAfterSeconds: limit.retryAfterSeconds,
        },
        429
      );
    }

    const clientEventId =
      parsedRequest.request.clientEventId ?? crypto.randomUUID();
    const { data: preparationData, error: preparationError } =
      await context.serviceClient.rpc('prepare_account_deletion_v1', {
        p_actor_id: context.user.id,
        p_client_event_id: clientEventId,
      });

    if (preparationError) {
      console.error('[delete-my-account] Ownership guard failed', {
        code: preparationError.code,
      });
      return accountNotDeletedResponse(
        'OWNERSHIP_CHECK_UNAVAILABLE',
        'Menta could not safely check group ownership. Nothing was deleted.',
        503
      );
    }

    const preparation = parseAccountDeletionPreparation(
      preparationData,
      clientEventId
    );
    if (!preparation) {
      await releaseAccountDeletionGuard(
        context.serviceClient,
        context.user.id,
        clientEventId
      );
      return accountNotDeletedResponse(
        'OWNERSHIP_CHECK_UNAVAILABLE',
        'Menta could not safely check group ownership. Nothing was deleted.',
        503
      );
    }
    if (preparation.state === 'blocked') {
      return accountNotDeletedResponse(
        preparation.code,
        'Delete each shared group you own before deleting your account.',
        409
      );
    }
    if (preparation.state === 'failed') {
      return accountNotDeletedResponse(
        preparation.code,
        'Menta could not start account deletion. Nothing was deleted.',
        409
      );
    }

    let appleAuthorization: 'not_applicable' | 'revoked' = 'not_applicable';
    if (appleProvider.linked) {
      try {
        await revokeAppleAuthorization({
          authorizationCode: parsedRequest.request
            .appleAuthorizationCode as string,
          config: appleRevocationConfig(),
          expectedSubject: appleProvider.subject as string,
        });
        appleAuthorization = 'revoked';
      } catch (error) {
        if (error instanceof AppleRevocationError) {
          console.error('[delete-my-account] Apple revocation failed', {
            code: error.code,
          });
          await releaseAccountDeletionGuard(
            context.serviceClient,
            context.user.id,
            clientEventId
          );
          return accountNotDeletedResponse(
            error.code,
            `${error.message} Your Menta account was not deleted.`,
            appleRevocationFailureStatus(error.code)
          );
        }

        console.error('[delete-my-account] Apple revocation failed');
        await releaseAccountDeletionGuard(
          context.serviceClient,
          context.user.id,
          clientEventId
        );
        return accountNotDeletedResponse(
          'APPLE_REVOCATION_FAILED',
          'Apple access could not be revoked. Your Menta account was not deleted.',
          502
        );
      }
    }

    const storage = await removeUserStorageObjects(
      context.serviceClient,
      context.user.id
    );
    if (!storage.ok) {
      await releaseAccountDeletionGuard(
        context.serviceClient,
        context.user.id,
        clientEventId
      );
      return accountNotDeletedResponse(
        'STORAGE_DELETION_FAILED',
        `${storage.message} Your Menta account was not deleted.`,
        502
      );
    }

    // Remove the provider user before deleting Menta identity. A 404 is a
    // confirmed clean state. A configured-provider failure is recoverable and
    // keeps the Menta account intact so the person can retry without leaving
    // an unreachable external messaging profile.
    try {
      await deleteOneSignalUser({
        appId: Deno.env.get('ONESIGNAL_APP_ID') ?? '',
        externalUserId: context.user.id,
        restApiKey: Deno.env.get('ONESIGNAL_REST_API_KEY') ?? '',
      });
    } catch {
      await releaseAccountDeletionGuard(
        context.serviceClient,
        context.user.id,
        clientEventId
      );
      return accountNotDeletedResponse(
        'ONESIGNAL_DELETION_FAILED',
        'Menta could not remove the notification profile. Nothing was deleted. Try again.',
        502
      );
    }

    const { data: commitData, error: commitError } =
      await context.serviceClient.rpc('commit_account_deletion_v1', {
        p_actor_id: context.user.id,
        p_client_event_id: clientEventId,
      });

    if (commitError) {
      console.error('[delete-my-account] Profile deletion result unknown', {
        code: commitError.code,
      });
      return jsonResponse(
        { error: 'Could not confirm account data deletion' },
        500
      );
    }

    const commit = parseAccountDeletionCommit(commitData, clientEventId);
    if (!commit) {
      return jsonResponse(
        { error: 'Could not confirm account data deletion' },
        500
      );
    }
    if (commit.state === 'blocked') {
      return accountNotDeletedResponse(
        commit.code,
        'Delete each shared group you own before deleting your account.',
        409
      );
    }
    if (commit.state === 'failed') {
      return accountNotDeletedResponse(
        commit.code,
        'Menta could not delete the account. Nothing was deleted.',
        409
      );
    }

    const { data: deletedAuthUser, error: authError } =
      await context.serviceClient.auth.admin.deleteUser(context.user.id);

    if (authError || !deletedAuthUser.user) {
      if (authError) {
        console.error('[delete-my-account] Auth delete failed:', authError);
      }
      return jsonResponse(
        { error: 'Could not confirm account login deletion' },
        500
      );
    }

    return jsonResponse({
      success: true,
      appleAuthorization,
      receiptId: clientEventId,
    });
  } catch (error) {
    console.error('[delete-my-account] Unexpected failure:', error);
    return jsonResponse({ error: 'Unexpected account deletion failure' }, 500);
  }
});
