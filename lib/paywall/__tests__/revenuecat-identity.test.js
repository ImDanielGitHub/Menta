const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../../..');
const compile = source =>
  ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
const deferred = () => {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return { promise, resolve };
};
const flush = async () => {
  for (let i = 0; i < 30; i += 1) await Promise.resolve();
};

// Run the actual provider module, isolating only native/platform dependencies.
// A stateful SDK fake exposes the final provider identity and overlapping calls.
function loadProvider() {
  const state = {
    user: { id: 'account-A' },
    isAuthenticated: true,
    isLoading: false,
  };
  const flags = { revenuecat_enabled: true, safe_mode: false };
  const sdk = { identity: null, concurrent: 0, maxConcurrent: 0 };
  const holds = {};
  const calls = [];
  const invoke = async (name, identity) => {
    calls.push([name, identity]);
    sdk.concurrent += 1;
    sdk.maxConcurrent = Math.max(sdk.maxConcurrent, sdk.concurrent);
    try {
      if (holds[name]) await holds[name].promise;
      if (name === 'configure' || name === 'logIn') {
        sdk.identity = identity ?? 'anonymous';
      } else if (name === 'logOut') {
        sdk.identity = 'anonymous';
      }
    } finally {
      sdk.concurrent -= 1;
    }
  };
  const native = {
    configure: ({ appUserID }) => invoke('configure', appUserID),
    logIn: id => invoke('logIn', id),
    logOut: () => invoke('logOut'),
    getAppUserID: async () => sdk.identity,
    generateRewardVerificationToken: async () => {
      calls.push(['token', sdk.identity]);
      return {
        appUserID: sdk.identity,
        clientTransactionId: 'synthetic-transaction',
        customData: 'synthetic-data',
      };
    },
    getOfferings: async () => ({ current: null, all: {} }),
  };
  const mocks = {
    'react-native': { Platform: { OS: 'ios' } },
    'expo-constants': {
      appOwnership: 'standalone',
      expoConfig: { extra: { revenuecatIosKey: 'synthetic-public-key' } },
    },
    '@/lib/operational-flags': { getOperationalFlag: name => flags[name] },
    '@/lib/toast-provider': { showGlobalToast: () => {} },
    '@/lib/localization/translate': { translate: (_locale, key) => key },
    '@/lib/profile-api': { getMyProAuthority: async () => null },
    '@/store/auth-store': { useAuthStore: { getState: () => state } },
    '@/lib/sentry': { addBreadcrumb: () => {}, captureError: () => {} },
    'react-native-purchases': native,
  };
  const mod = { exports: {} };
  vm.runInNewContext(
    compile(
      fs.readFileSync(path.join(root, 'lib/paywall/revenuecat.ts'), 'utf8')
    ),
    {
      module: mod,
      exports: mod.exports,
      require: name => {
        if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`);
        return mocks[name];
      },
      process: { env: {} },
      __DEV__: false,
      console,
      setTimeout,
      clearTimeout,
    }
  );
  return {
    api: mod.exports.RevenueCatAPI,
    exports: mod.exports,
    state,
    flags,
    sdk,
    holds,
    calls,
  };
}

// Execute the production root's purchase-identity effect without mounting the
// unrelated router and native UI. This evaluates behavior, not source strings.
function runRootIdentityEffect(provider, importReady = Promise.resolve()) {
  const source = fs.readFileSync(path.join(root, 'app/_layout.tsx'), 'utf8');
  const parsed = ts.createSourceFile(
    '_layout.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  let callback;
  const includesLogin = node => {
    if (
      ts.isPropertyAccessExpression(node) &&
      node.expression.getText(parsed) === 'RevenueCatAPI' &&
      node.name.text === 'logIn'
    )
      return true;
    return ts.forEachChild(node, includesLogin) === true;
  };
  const visit = node => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(parsed) === 'useEffect' &&
      node.arguments[0] &&
      includesLogin(node.arguments[0])
    )
      callback = node.arguments[0];
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  if (!callback) throw new Error('Root purchase identity effect not found');
  const mod = { exports: {} };
  const delayedModule = {
    __esModule: true,
    then: resolve => importReady.then(() => resolve(provider.exports)),
  };
  vm.runInNewContext(compile(`module.exports = ${callback.getText(parsed)};`), {
    module: mod,
    exports: mod.exports,
    require: name => {
      if (name !== '@/lib/paywall/revenuecat')
        throw new Error(`Unexpected dependency: ${name}`);
      return delayedModule;
    },
    user: provider.state.user,
    isLoading: provider.state.isLoading,
    useAuthStore: { getState: () => provider.state },
    captureRevenueCatIdentity: provider.exports.captureRevenueCatIdentity,
    startTransition: fn => fn(),
    setSentryUser: () => {},
    clearSentryUser: () => {},
    setRuntimeContext: () => {},
    rootDebugLog: () => {},
    console,
  });
  return mod.exports();
}

describe('RevenueCat account identity lifecycle', () => {
  it('cannot re-identify account A after logout overtakes a pending login', async () => {
    const p = loadProvider();
    const login = p.api.logIn('account-A');
    p.state.user = null;
    await p.api.logOut();
    await login;
    expect(p.sdk.identity).not.toBe('account-A');
    expect(p.api.isInitialized()).toBe(false);
  });

  it('drains an already-started configure before logout and the next account', async () => {
    const p = loadProvider();
    p.holds.configure = deferred();
    const initialized = p.api.initialize('account-A');
    await flush();
    expect(p.sdk.concurrent).toBe(1);
    const logout = p.api.logOut();
    p.state.user = { id: 'account-B' };
    const login = p.api.logIn('account-B');
    await flush();
    p.holds.configure.resolve();
    await Promise.all([initialized, logout, login]);
    expect(p.sdk.maxConcurrent).toBe(1);
    expect(p.sdk.identity).toBe('account-B');
    expect(p.api.isInitialized()).toBe(true);
  });

  it('waits for an in-flight native login before clearing the provider identity', async () => {
    const p = loadProvider();
    await p.api.initialize();
    p.holds.logIn = deferred();
    const login = p.api.logIn('account-A');
    await flush();
    let loggedOut = false;
    const logout = p.api.logOut().then(() => {
      loggedOut = true;
    });
    await flush();
    expect(loggedOut).toBe(false);
    p.holds.logIn.resolve();
    await Promise.all([login, logout]);
    expect(p.sdk.identity).toBe('anonymous');
    expect(p.sdk.maxConcurrent).toBe(1);
    expect(p.api.isInitialized()).toBe(false);
  });

  it('also serializes account-ad initialization so it cannot restore a signed-out identity', async () => {
    const p = loadProvider();
    p.holds.configure = deferred();
    const token = p.exports.prepareRevenueCatAdReward(
      'account-A',
      'impression'
    );
    await flush();
    p.state.user = null;
    const logout = p.api.logOut();
    p.holds.configure.resolve();
    await logout;
    expect(await token).toBeNull();
    expect(p.sdk.identity).toBe('anonymous');
    expect(p.calls.some(([name]) => name === 'token')).toBe(false);
  });

  it('rejects a root import from an old session even when the same user signs in again', async () => {
    const p = loadProvider();
    const imported = deferred();
    runRootIdentityEffect(p, imported.promise);
    await p.api.logOut();
    p.state.user = { id: 'account-A' };
    await p.api.logIn('account-A');
    const identityCallsBefore = p.calls.length;
    imported.resolve();
    await flush();
    expect(p.calls.length).toBe(identityCallsBefore);
    expect(p.sdk.identity).toBe('account-A');
  });

  it('does not use the account from a root effect that has already been cleaned up', async () => {
    const p = loadProvider();
    const imported = deferred();
    const cleanup = runRootIdentityEffect(p, imported.promise);
    if (cleanup) cleanup();
    imported.resolve();
    await flush();
    expect(p.sdk.identity).toBeNull();
  });

  it('invalidates pending identity work as soon as logout is requested', async () => {
    const p = loadProvider();
    const login = p.api.logIn('account-A');
    p.state.isLoading = true;
    p.api.invalidateIdentity();
    await login;
    expect(p.sdk.identity).toBeNull();
  });

  it('does not let account-ad work initialize purchases during logout', async () => {
    const p = loadProvider();
    p.state.isLoading = true;
    expect(
      await p.exports.prepareRevenueCatAdReward('account-A', 'impression')
    ).toBeNull();
    expect(p.sdk.identity).toBeNull();
  });

  it('does not bind a root identity while logout is in progress', async () => {
    const p = loadProvider();
    const imported = deferred();
    runRootIdentityEffect(p, imported.promise);
    p.state.isLoading = true;
    imported.resolve();
    await flush();
    expect(p.sdk.identity).toBeNull();
  });

  it('binds the current root account after its module import', async () => {
    const p = loadProvider();
    runRootIdentityEffect(p);
    await flush();
    expect(p.sdk.identity).toBe('account-A');
    expect(p.api.isInitialized()).toBe(true);
  });

  it('preserves current-account ad token initialization', async () => {
    const p = loadProvider();
    const token = await p.exports.prepareRevenueCatAdReward(
      'account-A',
      'impression'
    );
    expect(token?.appUserID).toBe('account-A');
    expect(p.calls.filter(([name]) => name === 'token')).toEqual([
      ['token', 'account-A'],
    ]);
  });

  it('preserves standalone initialize, login, logout and reinitialization', async () => {
    const p = loadProvider();
    p.state.user = null;
    await p.api.initialize();
    expect(p.sdk.identity).toBe('anonymous');
    await p.api.logIn('standalone-account');
    expect(p.sdk.identity).toBe('standalone-account');
    await p.api.logOut();
    expect(p.sdk.identity).toBe('anonymous');
    await p.api.initialize('other-account');
    expect(p.sdk.identity).toBe('other-account');
    expect(p.api.isInitialized()).toBe(true);
  });

  it.each(['safe_mode', 'revenuecat_enabled'])(
    'keeps the %s operational kill switch effective',
    async flag => {
      const p = loadProvider();
      p.flags[flag] = flag === 'safe_mode';
      await p.api.initialize('account-A');
      await p.api.logIn('account-A');
      await p.api.logOut();
      expect(p.calls).toEqual([]);
      p.flags[flag] = flag !== 'safe_mode';
      await p.api.initialize();
      expect(p.sdk.identity).toBe('anonymous');
    }
  );
});
