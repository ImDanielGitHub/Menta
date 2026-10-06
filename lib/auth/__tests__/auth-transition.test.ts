import {
  getAuthTransitionGeneration,
  hasActiveAuthTransition,
  invalidateAuthTransitionEvents,
  ownsAuthTransition,
  runAuthContinuation,
  runAuthTransition,
} from '../auth-transition';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('auth transition ownership', () => {
  it('releases ownership before resolving the caller', async () => {
    await runAuthTransition(async transition => {
      expect(ownsAuthTransition(transition)).toBe(true);
    });
    expect(hasActiveAuthTransition()).toBe(false);
  });

  it('keeps the next credential change behind the entire teardown', async () => {
    const gate = deferred();
    const observed: string[] = [];
    const first = runAuthTransition(async () => {
      observed.push('logout');
      await gate.promise;
      observed.push('teardown');
    });
    const second = runAuthTransition(async () => {
      observed.push('login');
    });
    expect(observed).toEqual(['logout']);
    gate.resolve();
    await Promise.all([first, second]);
    expect(observed).toEqual(['logout', 'teardown', 'login']);
  });

  it('rejects a stale queued account action without running it', async () => {
    const gate = deferred();
    let user = 'A';
    const first = runAuthTransition(async () => {
      await gate.promise;
      user = 'B';
    });
    let revoked = false;
    const logout = runAuthTransition(
      async () => {
        revoked = true;
      },
      () => user === 'A'
    );
    gate.resolve();
    await Promise.all([first, logout]);
    expect(revoked).toBe(false);
  });

  it('discards events emitted before a later transition or explicit clear', async () => {
    await runAuthTransition(async () => undefined);
    const emitted = getAuthTransitionGeneration();
    await runAuthTransition(async () => undefined);
    let accepted = false;
    await runAuthContinuation(emitted, async () => {
      accepted = true;
    });
    const current = getAuthTransitionGeneration();
    invalidateAuthTransitionEvents();
    await runAuthContinuation(current, async () => {
      accepted = true;
    });
    expect(accepted).toBe(false);
  });
});
