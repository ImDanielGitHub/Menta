jest.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));
jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
}));
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));
jest.mock('@/lib/report-drafts', () => ({
  clearReportDraftsForUser: jest.fn(),
}));
jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    stopUserScopedWork: jest.fn(),
    startUserScopedWork: jest.fn(),
  },
}));

import {
  AccountDeletionConfirmationError,
  AccountDeletionNotCompletedError,
  deleteMentaAccount,
} from '@/lib/account-deletion';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { clearReportDraftsForUser } from '@/lib/report-drafts';
import { notificationService } from '@/lib/services/notification-service';
import { supabase } from '@/lib/supabase';

const responseWithJson = (status: number, body: unknown): Response =>
  ({
    status,
    clone: () => ({
      json: async () => body,
    }),
  }) as unknown as Response;

const CLIENT_EVENT_ID = '11111111-1111-4111-8111-111111111111';

describe('account deletion lifecycle', () => {
  const invoke = jest.mocked(supabase.functions.invoke);
  const isAppleAuthenticationAvailable = jest.mocked(
    AppleAuthentication.isAvailableAsync
  );
  const signInWithApple = jest.mocked(AppleAuthentication.signInAsync);
  const randomUUID = jest.mocked(Crypto.randomUUID);
  const clearReportDrafts = jest.mocked(clearReportDraftsForUser);
  const stopUserScopedWork = jest.mocked(
    notificationService.stopUserScopedWork
  );
  const startUserScopedWork = jest.mocked(
    notificationService.startUserScopedWork
  );
  beforeEach(() => {
    jest.clearAllMocks();
    isAppleAuthenticationAvailable.mockResolvedValue(true);
    randomUUID.mockReturnValue(CLIENT_EVENT_ID);
  });

  it('only clears local account state after the server confirms deletion', async () => {
    invoke.mockResolvedValue({
      data: { success: true, appleAuthorization: 'not_applicable' },
      error: null,
    });

    await expect(deleteMentaAccount('user-1')).resolves.toEqual({
      success: true,
      appleAuthorization: 'not_applicable',
    });

    expect(stopUserScopedWork).toHaveBeenCalledWith('user-1');
    expect(stopUserScopedWork.mock.invocationCallOrder[0]).toBeLessThan(
      invoke.mock.invocationCallOrder[0]
    );
    expect(clearReportDrafts).toHaveBeenCalledWith('user-1');
    expect(invoke.mock.invocationCallOrder[0]).toBeLessThan(
      clearReportDrafts.mock.invocationCallOrder[0]
    );
  });

  it('keeps the confirmed deletion result when report-draft cleanup fails', async () => {
    clearReportDrafts.mockRejectedValue(new Error('local storage unavailable'));
    invoke.mockResolvedValue({
      data: { success: true, appleAuthorization: 'not_applicable' },
      error: null,
    });

    await expect(deleteMentaAccount('user-1')).resolves.toEqual({
      success: true,
      appleAuthorization: 'not_applicable',
    });

    expect(clearReportDrafts).toHaveBeenCalledWith('user-1');
  });

  it('keeps local account state intact when the server response is missing', async () => {
    invoke.mockResolvedValue({ data: null, error: null });

    await expect(deleteMentaAccount('user-1')).rejects.toThrow(
      'confirmed account-deletion receipt'
    );
    expect(stopUserScopedWork).toHaveBeenCalledWith('user-1');
    expect(startUserScopedWork).not.toHaveBeenCalled();
    expect(clearReportDrafts).not.toHaveBeenCalled();
  });

  it('reauthenticates Apple once and sends only its fresh authorization code', async () => {
    const reauthReceipt = {
      success: false,
      accountDeleted: false,
      recoverable: true,
      code: 'APPLE_REAUTH_REQUIRED',
      error: 'Sign in with Apple again.',
    };
    invoke
      .mockResolvedValueOnce({
        data: null,
        error: new Error('Edge Function returned a non-2xx status code'),
        response: responseWithJson(428, reauthReceipt),
      })
      .mockResolvedValueOnce({
        data: { success: true, appleAuthorization: 'revoked' },
        error: null,
      });
    signInWithApple.mockResolvedValue({
      authorizationCode: 'fresh-apple-code',
      state: CLIENT_EVENT_ID,
    } as AppleAuthentication.AppleAuthenticationCredential);

    await expect(deleteMentaAccount('user-1')).resolves.toEqual({
      success: true,
      appleAuthorization: 'revoked',
    });

    expect(signInWithApple).toHaveBeenCalledWith({
      requestedScopes: [],
      state: CLIENT_EVENT_ID,
    });
    expect(invoke).toHaveBeenNthCalledWith(1, 'delete-my-account', {
      body: { clientEventId: CLIENT_EVENT_ID },
    });
    expect(invoke).toHaveBeenNthCalledWith(2, 'delete-my-account', {
      body: {
        appleAuthorizationCode: 'fresh-apple-code',
        clientEventId: CLIENT_EVENT_ID,
      },
    });
    expect(JSON.stringify(invoke.mock.calls[1][1])).not.toContain(
      'identityToken'
    );
  });

  it('keeps the account active when Apple reauthentication is cancelled', async () => {
    const reauthReceipt = {
      success: false,
      accountDeleted: false,
      recoverable: true,
      code: 'APPLE_REAUTH_REQUIRED',
      error: 'Sign in with Apple again.',
    };
    invoke.mockResolvedValueOnce({
      data: null,
      error: new Error('Edge Function returned a non-2xx status code'),
      response: responseWithJson(428, reauthReceipt),
    });
    signInWithApple.mockRejectedValue({ code: 'ERR_REQUEST_CANCELED' });

    await expect(deleteMentaAccount('user-1')).rejects.toMatchObject({
      name: 'AccountDeletionNotCompletedError',
      code: 'APPLE_REAUTH_CANCELLED',
    });
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(clearReportDrafts).not.toHaveBeenCalled();
  });

  it('uses the recoverable server receipt when Apple revocation fails', async () => {
    const reauthReceipt = {
      success: false,
      accountDeleted: false,
      recoverable: true,
      code: 'APPLE_REAUTH_REQUIRED',
      error: 'Sign in with Apple again.',
    };
    const revocationFailure = {
      success: false,
      accountDeleted: false,
      recoverable: true,
      code: 'APPLE_REVOCATION_FAILED',
      error: 'Apple access could not be revoked. The account was not deleted.',
    };
    invoke
      .mockResolvedValueOnce({
        data: null,
        error: new Error('Edge Function returned a non-2xx status code'),
        response: responseWithJson(428, reauthReceipt),
      })
      .mockResolvedValueOnce({
        data: null,
        error: new Error('Edge Function returned a non-2xx status code'),
        response: responseWithJson(502, revocationFailure),
      });
    signInWithApple.mockResolvedValue({
      authorizationCode: 'fresh-apple-code',
      state: CLIENT_EVENT_ID,
    } as AppleAuthentication.AppleAuthenticationCredential);

    await expect(deleteMentaAccount('user-1')).rejects.toMatchObject({
      name: 'AccountDeletionNotCompletedError',
      code: 'APPLE_REVOCATION_FAILED',
    });
    expect(clearReportDrafts).not.toHaveBeenCalled();
  });

  it('rejects a success body that does not confirm Apple authorization state', async () => {
    invoke.mockResolvedValue({ data: { success: true }, error: null });

    await expect(deleteMentaAccount('user-1')).rejects.toBeInstanceOf(
      AccountDeletionConfirmationError
    );
    expect(clearReportDrafts).not.toHaveBeenCalled();
  });

  it('classifies pre-deletion HTTP rejection as definitively not completed', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new Error('Edge Function returned a non-2xx status code'),
      response: { status: 429 } as Response,
    });

    await expect(deleteMentaAccount('user-1')).rejects.toBeInstanceOf(
      AccountDeletionNotCompletedError
    );

    expect(stopUserScopedWork).toHaveBeenCalledWith('user-1');
    expect(clearReportDrafts).not.toHaveBeenCalled();
  });

  it('keeps the final shared-group ownership rejection typed instead of unknown', async () => {
    const ownershipBlocker = {
      success: false,
      accountDeleted: false,
      recoverable: true,
      code: 'OWNED_GROUP_HAS_OTHER_MEMBERS',
      error: 'Delete or transfer each shared group first.',
    };
    invoke.mockResolvedValue({
      data: null,
      error: new Error('Edge Function returned a non-2xx status code'),
      response: responseWithJson(409, ownershipBlocker),
    });

    await expect(deleteMentaAccount('user-1')).rejects.toMatchObject({
      name: 'AccountDeletionNotCompletedError',
      code: 'OWNED_GROUP_HAS_OTHER_MEMBERS',
    });

    expect(clearReportDrafts).not.toHaveBeenCalled();
  });

  it('keeps a server failure after deletion may have started as unknown', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new Error('Edge Function returned a non-2xx status code'),
      response: { status: 500 } as Response,
    });

    await expect(deleteMentaAccount('user-1')).rejects.not.toBeInstanceOf(
      AccountDeletionNotCompletedError
    );

    expect(startUserScopedWork).not.toHaveBeenCalled();
    expect(clearReportDrafts).not.toHaveBeenCalled();
  });

  it('does not treat a negative server result as a deletion receipt', async () => {
    invoke.mockResolvedValue({ data: { success: false }, error: null });

    await expect(deleteMentaAccount('user-1')).rejects.toBeInstanceOf(
      AccountDeletionNotCompletedError
    );

    expect(stopUserScopedWork).toHaveBeenCalledWith('user-1');
    expect(clearReportDrafts).not.toHaveBeenCalled();
  });

  it('keeps local account state intact when the delete function errors', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('response lost') });

    await expect(deleteMentaAccount('user-1')).rejects.toThrow('response lost');
    expect(stopUserScopedWork).toHaveBeenCalledWith('user-1');
    expect(startUserScopedWork).not.toHaveBeenCalled();
    expect(clearReportDrafts).not.toHaveBeenCalled();
  });
});
