import {
  canOpenAccountDeletionConfirmation,
  createAccountDeletionPreflightReader,
  type AccountDeletionOwnedGroup,
} from '@/lib/account-deletion-preflight';
import type { MyProAuthority } from '@/lib/profile-api';

const userId = 'user-1';

const privateOwnedGroup: AccountDeletionOwnedGroup = {
  id: 'group-private',
  kind: 'promise',
  name: 'Weekday reset',
  otherMemberCount: 0,
  status: 'active',
  willBeDeleted: true,
};

const sharedOwnedGroup: AccountDeletionOwnedGroup = {
  id: 'group-shared',
  kind: 'saved',
  name: 'Morning Run Club',
  otherMemberCount: 2,
  status: 'active',
  willBeDeleted: true,
};

const createReader = ({
  groups = [],
  proAuthority = { is_pro: false, reconciliation_pending: false },
}: {
  groups?: AccountDeletionOwnedGroup[];
  proAuthority?: MyProAuthority | null;
} = {}) => {
  const dependencies = {
    readCurrentUserId: jest.fn(async () => userId),
    readOwnedGroups: jest.fn(async () => groups),
    readProAuthority: jest.fn(async () => proAuthority),
  };

  return {
    dependencies,
    readPreflight: createAccountDeletionPreflightReader(dependencies),
  };
};

describe('account deletion preflight', () => {
  it('resolves with no ownership blocker when the account owns no groups', async () => {
    const { readPreflight } = createReader();

    const result = await readPreflight({
      expectedUserId: userId,
      isOnline: true,
    });

    expect(result).toEqual({
      account: { status: 'verified', userId },
      canProceed: true,
      ownership: { groups: [], status: 'clear' },
      status: 'resolved',
      subscription: { status: 'inactive' },
    });
    expect(canOpenAccountDeletionConfirmation(result)).toBe(true);
  });

  it('keeps a private owned group as a disclosed consequence without inventing a transfer blocker', async () => {
    const { readPreflight } = createReader({ groups: [privateOwnedGroup] });

    const result = await readPreflight({
      expectedUserId: userId,
      isOnline: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        canProceed: true,
        ownership: {
          groups: [privateOwnedGroup],
          status: 'clear',
        },
        status: 'resolved',
      })
    );
    expect(canOpenAccountDeletionConfirmation(result)).toBe(true);
  });

  it('blocks typed confirmation while an owned group still has other members', async () => {
    const { readPreflight } = createReader({ groups: [sharedOwnedGroup] });

    const result = await readPreflight({
      expectedUserId: userId,
      isOnline: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        canProceed: false,
        ownership: {
          blockingGroups: [sharedOwnedGroup],
          groups: [sharedOwnedGroup],
          status: 'blocked',
        },
        status: 'resolved',
      })
    );
    expect(canOpenAccountDeletionConfirmation(result)).toBe(false);
  });

  it('shows an active canonical entitlement as a notice without making it an ownership blocker', async () => {
    const { readPreflight } = createReader({
      proAuthority: { is_pro: true, reconciliation_pending: false },
    });

    const result = await readPreflight({
      expectedUserId: userId,
      isOnline: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        canProceed: true,
        status: 'resolved',
        subscription: { status: 'active' },
      })
    );
    expect(canOpenAccountDeletionConfirmation(result)).toBe(true);
  });

  it('fails closed offline without starting any account reads', async () => {
    const { dependencies, readPreflight } = createReader();

    const result = await readPreflight({
      expectedUserId: userId,
      isOnline: false,
    });

    expect(result).toEqual({
      canProceed: false,
      reason: 'offline',
      status: 'unknown',
    });
    expect(dependencies.readCurrentUserId).not.toHaveBeenCalled();
    expect(dependencies.readOwnedGroups).not.toHaveBeenCalled();
    expect(dependencies.readProAuthority).not.toHaveBeenCalled();
    expect(canOpenAccountDeletionConfirmation(result)).toBe(false);
  });

  it('fails closed when the server cannot confirm subscription authority', async () => {
    const { readPreflight } = createReader({ proAuthority: null });

    const result = await readPreflight({
      expectedUserId: userId,
      isOnline: true,
    });

    expect(result).toEqual({
      canProceed: false,
      reason: 'subscription-unavailable',
      status: 'unknown',
    });
    expect(canOpenAccountDeletionConfirmation(result)).toBe(false);
  });

  it('fails closed while RevenueCat entitlement events need reconciliation', async () => {
    const { readPreflight } = createReader({
      proAuthority: { is_pro: false, reconciliation_pending: true },
    });

    const result = await readPreflight({
      expectedUserId: userId,
      isOnline: true,
    });

    expect(result).toEqual({
      canProceed: false,
      reason: 'subscription-reconciling',
      status: 'unknown',
    });
    expect(canOpenAccountDeletionConfirmation(result)).toBe(false);
  });

  it('does not apply a preflight result after the signed-in account changes', async () => {
    const { dependencies, readPreflight } = createReader();
    dependencies.readCurrentUserId.mockResolvedValueOnce('user-2');

    const result = await readPreflight({
      expectedUserId: userId,
      isOnline: true,
    });

    expect(result).toEqual({
      canProceed: false,
      reason: 'account-changed',
      status: 'unknown',
    });
    expect(dependencies.readOwnedGroups).not.toHaveBeenCalled();
    expect(dependencies.readProAuthority).not.toHaveBeenCalled();
    expect(canOpenAccountDeletionConfirmation(result)).toBe(false);
  });
});
