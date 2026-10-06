// Real pinned SDK, synthetic storage and fetch only. No network or account access.
const assert = require('node:assert/strict');
const { GoTrueClient, processLock } = require('@supabase/auth-js');
const originalNow = Date.now;
let now = 1800000000000;
Date.now = () => now;
const deferred = () => {
  let resolve;
  const promise = new Promise(r => {
    resolve = r;
  });
  return { promise, resolve };
};
const tick = () => new Promise(resolve => setImmediate(resolve));
const response = (body, status = 200) =>
  new Response(body === undefined ? undefined : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
const session = (id, expired = false, suffix = '') => ({
  access_token: `synthetic-access-${id}${suffix}`,
  refresh_token: `synthetic-refresh-${id}${suffix}`,
  token_type: 'bearer',
  expires_in: expired ? -100 : 3600,
  expires_at: Math.floor(now / 1000) + (expired ? -100 : 3600),
  user: {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
  },
});
const storage = () => {
  const values = new Map();
  let tail = Promise.resolve();
  const run = fn => {
    const result = tail.then(fn);
    tail = result.catch(() => undefined);
    return result;
  };
  return {
    values,
    getItem: key => run(() => values.get(key) ?? null),
    setItem: (key, value) =>
      run(() => {
        values.set(key, value);
      }),
    removeItem: key =>
      run(() => {
        values.delete(key);
      }),
  };
};
async function client(store, key, fetch) {
  const auth = new GoTrueClient({
    url: 'https://synthetic.invalid/auth/v1',
    storageKey: key,
    storage: store,
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
    lockAcquireTimeout: -1,
    fetch,
  });
  await auth.initialize();
  return auth;
}
const passed = [];
async function run(name, work) {
  await work();
  passed.push(name);
}
(async () => {
  await run(
    'expired retryable failure removes durable session, user and indexed PKCE keys',
    async () => {
      const s = storage(),
        key = 'synthetic-expired';
      const c = await client(s, key, async () => {
        now += 35000;
        return response({ msg: 'synthetic unavailable' }, 503);
      });
      s.values.set(key, JSON.stringify(session('A', true)));
      s.values.set(key + '-user', JSON.stringify({ user: { id: 'A' } }));
      s.values.set(
        key + '-code-verifier',
        JSON.stringify('synthetic-verifier')
      );
      s.values.set(
        key + '-flows-code-verifier',
        JSON.stringify(['synthetic-flow'])
      );
      s.values.set(
        key + '-flow-synthetic-flow-code-verifier',
        JSON.stringify('synthetic-flow-verifier')
      );
      s.values.set(
        'isolated-recovery-session',
        JSON.stringify(session('Recovery'))
      );
      const result = await c.signOut();
      assert.equal(result.error?.status, 503);
      for (const entry of [...s.values.keys()])
        assert(!entry.startsWith(key), entry + ' remains after logout');
      assert(s.values.has('isolated-recovery-session'));
      const restarted = await client(s, key, async () => {
        throw Error('unexpected network after local logout');
      });
      assert.equal((await restarted.getSession()).data.session, null);
    }
  );
  await run(
    'remote failure still reports error after clearing local state',
    async () => {
      const s = storage(),
        key = 'synthetic-remote-error';
      const c = await client(s, key, async () =>
        response({ msg: 'synthetic unavailable' }, 503)
      );
      s.values.set(key, JSON.stringify(session('A')));
      const result = await c.signOut();
      assert.equal(result.error?.status, 503);
      assert.equal(s.values.get(key), undefined);
    }
  );
  await run(
    'expired global logout refreshes before revoking with the fresh token',
    async () => {
      const s = storage(),
        key = 'synthetic-global',
        calls = [];
      const c = await client(s, key, async (url, options) => {
        calls.push({ url, authorization: options.headers.Authorization });
        return url.includes('refresh_token')
          ? response(session('A', false, '-rotated'))
          : response(undefined, 204);
      });
      s.values.set(key, JSON.stringify(session('A', true)));
      assert.equal((await c.signOut()).error, null);
      assert.equal(calls.length, 2);
      assert(calls[1].url.includes('scope=global'));
      assert.equal(calls[1].authorization, 'Bearer synthetic-access-A-rotated');
      assert.equal(s.values.get(key), undefined);
    }
  );
  await run(
    'local scope preserves its remote scope and removes local credentials',
    async () => {
      const s = storage(),
        key = 'synthetic-local';
      const c = await client(s, key, async url => {
        assert(url.includes('scope=local'));
        return response(undefined, 204);
      });
      s.values.set(key, JSON.stringify(session('A')));
      assert.equal((await c.signOut({ scope: 'local' })).error, null);
      assert.equal(s.values.get(key), undefined);
    }
  );
  await run(
    'others scope preserves local credentials on success and refresh failure',
    async () => {
      const s = storage(),
        key = 'synthetic-others';
      let fail = false;
      const c = await client(s, key, async url => {
        if (fail) {
          now += 35000;
          return response({ msg: 'synthetic unavailable' }, 503);
        }
        assert(url.includes('scope=others'));
        return response(undefined, 204);
      });
      s.values.set(key, JSON.stringify(session('A')));
      assert.equal((await c.signOut({ scope: 'others' })).error, null);
      assert(s.values.has(key));
      fail = true;
      s.values.set(key, JSON.stringify(session('A', true)));
      assert.equal((await c.signOut({ scope: 'others' })).error.status, 503);
      assert(s.values.has(key));
    }
  );
  await run(
    'storage removal failure rejects and cannot claim successful logout',
    async () => {
      const s = storage(),
        key = 'synthetic-storage-failure';
      const c = await client(s, key, async () => response(undefined, 204));
      s.values.set(key, JSON.stringify(session('A')));
      s.removeItem = async () => {
        throw Error('synthetic removal failure');
      };
      await assert.rejects(c.signOut(), /synthetic removal failure/);
      assert(s.values.has(key));
    }
  );
  await run(
    'shared lock orders background refresh before the second client logout',
    async () => {
      const s = storage(),
        key = 'synthetic-two-clients',
        started = deferred(),
        release = deferred();
      const first = await client(s, key, async () => {
        started.resolve();
        await release.promise;
        return response(session('A', false, '-rotated'));
      });
      let revocations = 0;
      const second = await client(s, key, async () => {
        revocations++;
        return response(undefined, 204);
      });
      s.values.set(key, JSON.stringify(session('A', true)));
      const refresh = first.getSession();
      await started.promise;
      const logout = second.signOut();
      await tick();
      assert.equal(revocations, 0);
      release.resolve();
      await refresh;
      await logout;
      assert.equal(revocations, 1);
      assert.equal(s.values.get(key), undefined);
    }
  );
  await run(
    'initial session emission keeps its custom lock through the pending read',
    async () => {
      const s = storage(),
        key = 'synthetic-initial-event',
        readStarted = deferred(),
        release = deferred(),
        emitted = deferred(),
        trace = [];
      const first = await client(s, key, async () => response(undefined, 204));
      const second = await client(s, key, async () => response(undefined, 204));
      s.values.set(key, JSON.stringify(session('A')));
      const read = s.getItem;
      let hold = true;
      s.getItem = async k => {
        const snapshot = await read(k);
        if (k === key && hold) {
          hold = false;
          readStarted.resolve();
          await release.promise;
        }
        return snapshot;
      };
      const {
        data: { subscription },
      } = first.onAuthStateChange(event => {
        if (event === 'INITIAL_SESSION') {
          trace.push('initial');
          emitted.resolve();
        }
      });
      await readStarted.promise;
      let completed = false;
      const logout = second.signOut().then(() => {
        completed = true;
        trace.push('logout');
      });
      await tick();
      const prematurelyCompleted = completed;
      release.resolve();
      await emitted.promise;
      await logout;
      subscription.unsubscribe();
      assert.equal(prematurelyCompleted, false);
      assert.deepEqual(trace, ['initial', 'logout']);
      assert.equal(s.values.get(key), undefined);
    }
  );
  process.stdout.write(JSON.stringify({ passed }) + '\n');
})()
  .catch(error => {
    process.stderr.write(String(error.stack ?? error) + '\n');
    process.exitCode = 1;
  })
  .finally(() => {
    Date.now = originalNow;
  });
