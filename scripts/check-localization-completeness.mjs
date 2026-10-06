#!/usr/bin/env node

/**
 * Static localisation completeness gate.
 *
 * This intentionally reads source with the TypeScript compiler API instead of
 * importing application modules. The checker must run before Metro/Babel can
 * resolve the `@/` alias, and it must be safe to run against a fixture tree.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const args = process.argv.slice(2);
const valueFor = (flag, fallback = null) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const ROOT = path.resolve(valueFor('--root', process.cwd()));
const JSON_OUTPUT = args.includes('--json');
const NO_FAIL = args.includes('--no-fail');

const PRODUCTION_ROOTS = [
  'app',
  'components',
  'hooks',
  'lib',
  'store',
  'utils',
];

const EXCLUDED_PATHS = [
  /(?:^|\/)__tests__(?:\/|$)/,
  /\.(?:test|spec)\.[cm]?[jt]sx?$/,
  /^(?:components\/)?(?:paper-gallery|app-store-capture)(?:\/|$)/,
  /^lib\/app-store-capture-registry\.ts$/,
  /^lib\/paper-state-registry(?:\/|$)/,
  /^lib\/localization(?:\/|$)/,
  /^lib\/database\.types\.ts$/,
  /(?:^|\/)(?:fixtures?|seed(?:s|ed)?|gallery|dev-only)(?:\/|[-_.])/i,
  /(?:^|\/)(?:admin|debug)(?:\/|$)/i,
];

const USER_FACING_ATTRIBUTES = new Set([
  'accessibilityHint',
  'accessibilityLabel',
  'description',
  'emptyMessage',
  'errorMessage',
  'errorText',
  'helperText',
  'hint',
  'label',
  'loadingLabel',
  'message',
  'placeholder',
  'primaryLabel',
  'secondaryLabel',
  'subtitle',
  'text',
  'title',
]);

const USER_FACING_KEYS = new Set([
  'accessibilityHint',
  'accessibilityLabel',
  'body',
  'buttonLabel',
  'cta',
  'description',
  'detail',
  'emptyMessage',
  'error',
  'errorMessage',
  'errorText',
  'helper',
  'helperText',
  'hint',
  'label',
  'loadingLabel',
  'message',
  'placeholder',
  'primaryLabel',
  'reason',
  'secondaryLabel',
  'status',
  'subtitle',
  'text',
  'title',
  'verificationDescription',
  'submissionText',
]);

const FEEDBACK_CALLS = new Set([
  'Alert.alert',
  'showGlobalToast',
  'showToast',
  'toast',
  'ToastAndroid.show',
  'announceForAccessibility',
]);

const CUSTOMER_ERROR_SETTERS = new Set([
  'setErrorMessage',
  'setErrorText',
  'setFriendlyError',
  'setUserError',
  'showError',
]);

// React state setters that carry customer-facing copy. Keep this list scoped
// to copy-bearing state rather than treating every set* call as display text;
// setters such as setStep and setStatus carry machine values.
const CUSTOMER_COPY_SETTERS = new Set([
  ...CUSTOMER_ERROR_SETTERS,
  'setAuthNotice',
  'setActionMessage',
  'setBoostConfirmError',
  'setFinishError',
  'setRefreshErrorBanner',
  'setReferralError',
  'setValidation',
]);

const COPY_VARIABLE_NAMES =
  /(?:copy|label|title|subtitle|description|detail|body|message|error|headline|hint|examples?|proofName|verificationDescription|submissionText)$/i;

const TECHNICAL_PROPERTY_NAMES = new Set([
  'action',
  'align',
  'category',
  'color',
  'day',
  'direction',
  'eventName',
  'hour',
  'hourCycle',
  'id',
  'kind',
  'lane',
  'minute',
  'mode',
  'month',
  'numeric',
  'path',
  'position',
  'role',
  'size',
  'source',
  'state',
  'status',
  'style',
  'testID',
  'timeZone',
  'tone',
  'tracking',
  'type',
  'value',
  'variant',
  'weekday',
  'year',
]);

const PROVIDER_WORDS =
  /(?:AppleAuthentication|GoogleSignin|RevenueCat|Purchases|OneSignal|Sentry|PostHog|Amplitude|Facebook|Stripe|Supabase|expo-(?:auth|notifications|camera|tracking)|NativeModules)/i;

const INTERNAL_WORDS =
  /^(?:console|logger|logError|captureException|captureMessage|track|identify|setContext|setTag)$/i;

const COPY_HELPER_FILE = /(?:presentation|copy|error)/i;

const OPTIONAL_DYNAMIC_SOURCE_KEY = /^(?:fullAuth|groups|todayProof)\.source\./;
const OPTIONAL_REGIONAL_VARIANT_KEY =
  /^(?:commerce\.commerce\.(?:loadingTitle|loadingDetail)|commerce\.wallet\.(?:rewardCheckingTitle|rewardCheckingDetail|rewardMissingTitle|rewardMissingDetail|refreshBalanceAction|rewardDailyLimitTitle|rewardDailyLimitDetail|rewardCheckingAccessibility|refreshingBalance|rewardClaimInProgress)|events\.(?:detail\.join_unknown_with_message|check_in\.unknown_with_message)|todayProof\.promise\.submission_time_unavailable|commerce\.paywall\.(?:quotaGroup\.(?:one|other)|savedSubject\.(?:group|promise|draft)|oneAdEnough\.(?:group|promise|draft))|groups\.(?:detail\.not_archived_title|detail\.privacy_group\.(?:discoverable|invite_link_only|invite_only))|todayProof\.residual\.(?:delivery_not_confirmed|promise_status_unavailable|proof_still_saved_on_this_phone|nothing_saved_on_this_phone_was_changed|proof_receive_not_confirmed|latest_promise_details_not_confirmed))$/;
const TRANSLATION_WRAPPER_NAMES = new Set([
  'defaultTranslate',
  'localise',
  'streakMessage',
  't',
]);

// These helpers classify provider, network, persistence, and protocol state.
// Their strings are diagnostic/domain values, not customer-facing copy. Keep
// the exclusion explicit so a new copy helper cannot silently opt out.
const TECHNICAL_HELPER_FILES = new Set([
  'hooks/useGroupDetail.ts',
  'lib/sentry.ts',
  'lib/time/proof-due.ts',
  'store/auth-store.ts',
  'store/group-store.ts',
]);

// These values are protocol tokens, not customer-facing copy. Keep this list
// explicit and scoped to the owning field/file so a lowercase string in a
// status, reason, or message field is still audited by default.
const MACHINE_TOKEN_ALLOWLIST = new Map([
  [
    'app/settings.tsx',
    new Map([
      ['reason', new Set(['offline', 'session-unavailable'])],
      ['status', new Set(['unknown'])],
    ]),
  ],
  [
    'app/groups/[id].tsx',
    new Map([['reason', new Set(['permission', 'validation'])]]),
  ],
  [
    'app/join-group.tsx',
    new Map([['reason', new Set(['insufficient-momenta', 'quota'])]]),
  ],
  [
    'app/shop/[id].tsx',
    new Map([
      [
        'reason',
        new Set([
          'error',
          'insufficient-momenta',
          'module_missing',
          'reward_unconfirmed',
        ]),
      ],
    ]),
  ],
  [
    'components/ui/ConfirmActionButton.tsx',
    new Map([['reason', new Set(['insufficient-momenta'])]]),
  ],
  [
    'lib/paywall/revenuecat.ts',
    new Map([['showGlobalToast', new Set(['error', 'info'])]]),
  ],
  [
    'components/update/LegacyAppUpdateGate.tsx',
    new Map([['status', new Set(['authority_unknown'])]]),
  ],
  [
    'lib/legacy-app-update-policy.ts',
    new Map([
      [
        'status',
        new Set(['authority_unknown', 'current', 'kill_switch', 'offer']),
      ],
    ]),
  ],
  [
    'lib/motion/event-receipt-haptics.ts',
    new Map([['reason', new Set(['permission'])]]),
  ],
  [
    'store/auth-store.ts',
    new Map([['showGlobalToast', new Set(['error', 'success'])]]),
  ],
  [
    'store/momenta-store.ts',
    new Map([
      [
        'reason',
        new Set(['cooldown', 'daily-limit', 'unauthenticated', 'unknown']),
      ],
    ]),
  ],
  [
    'app/report-issue.tsx',
    new Map([
      ['reason', new Set(['inappropriate'])],
      ['status', new Set(['not-sent', 'server-confirmed'])],
    ]),
  ],
  [
    'app/verification.tsx',
    new Map([['reason', new Set(['none', 'network_or_server'])]]),
  ],
  [
    'lib/ads.ts',
    new Map([
      [
        'reason',
        new Set([
          'ads_disabled',
          'background',
          'consent_error',
          'consent_required',
          'consent_unavailable',
          'cooldown',
          'daily_limit',
          'error',
          'invalid_config',
          'load_failed',
          'module_missing',
          'no_fill',
          'not_required',
          'reward_unconfirmed',
          'show_failed',
          'timeout',
          'unavailable',
        ]),
      ],
    ]),
  ],
  [
    'lib/app-intents/native-router-path.ts',
    new Map([['status', new Set(['event'])]]),
  ],
  [
    'lib/app-update-policy.ts',
    new Map([
      [
        'status',
        new Set(['authority_unknown', 'current', 'kill_switch', 'offer']),
      ],
    ]),
  ],
  [
    'lib/account-deletion-preflight.ts',
    new Map([
      [
        'reason',
        new Set([
          'account-changed',
          'offline',
          'ownership-unavailable',
          'session-unavailable',
          'subscription-reconciling',
          'subscription-unavailable',
        ]),
      ],
      [
        'status',
        new Set([
          'active',
          'blocked',
          'clear',
          'inactive',
          'resolved',
          'unknown',
          'verified',
        ]),
      ],
    ]),
  ],
  [
    'lib/events/links.ts',
    new Map([['status', new Set(['event', 'invalid_event', 'not_event'])]]),
  ],
  ['lib/experiments.ts', new Map([['status', new Set(['draft'])]])],
  [
    'lib/invite-links.ts',
    new Map([['status', new Set(['challenge', 'group', 'invalid'])]]),
  ],
  [
    'lib/navigation/pending-invite-open.ts',
    new Map([['status', new Set(['auth_required', 'none'])]]),
  ],
  ['lib/posthog.tsx', new Map([['status', new Set(['authority_unknown'])]])],
  [
    'lib/report-drafts.ts',
    new Map([['status', new Set(['draft', 'submitting'])]]),
  ],
  [
    'lib/toast-provider.tsx',
    new Map([['showToast', new Set(['error', 'success'])]]),
  ],
  [
    'store/challenge-store.ts',
    new Map([['status', new Set(['active', 'failed'])]]),
  ],
  [
    'store/event-store.ts',
    new Map([
      [
        'status',
        new Set(['failed', 'saved_local', 'unknown_result', 'uploading']),
      ],
    ]),
  ],
]);

const STYLE_NAMES =
  /^(?:style|styles|theme|tokens?|palette|colou?r(?:s)?|typography|spacing|dimensions|layout|icon(?:s)?|testID)$/i;

const normalise = value =>
  String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

const relative = file => path.relative(ROOT, file).split(path.sep).join('/');

const isExcluded = file => EXCLUDED_PATHS.some(pattern => pattern.test(file));

const lineOf = (sourceFile, position) =>
  sourceFile.getLineAndCharacterOfPosition(position).line + 1;

const identifierName = node => (node && ts.isIdentifier(node) ? node.text : '');

const propertyName = node => {
  if (!node?.name) return '';
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) {
    return node.name.text;
  }
  return '';
};

const callName = expression => {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) {
    const parent = callName(expression.expression);
    return parent ? `${parent}.${expression.name.text}` : expression.name.text;
  }
  return '';
};

const jsxTagName = node => {
  let current = node;
  while (current) {
    if (ts.isJsxElement(current))
      return current.openingElement.tagName.getText();
    if (ts.isJsxSelfClosingElement(current)) return current.tagName.getText();
    current = current.parent;
  }
  return '';
};

const isTranslationCall = (node, translationCallKinds = null) => {
  if (!ts.isCallExpression(node)) return false;
  const name = callName(node.expression);
  if (translationCallKinds?.has(name)) return true;
  return (
    name === 't' ||
    name === 'translate' ||
    name === 'localise' ||
    name.endsWith('.t')
  );
};

const translationKeyArgument = (node, translationCallKinds = null) => {
  if (!ts.isCallExpression(node)) return null;
  const name = callName(node.expression);
  const kind = translationCallKinds?.get(name) ?? name;
  return node.arguments[kind === 'translate' ? 1 : 0] ?? null;
};

const containsTranslationCall = (node, translationCallKinds = null) => {
  if (!node) return false;
  if (isTranslationCall(node, translationCallKinds)) return true;
  let found = false;
  ts.forEachChild(node, child => {
    if (!found && containsTranslationCall(child, translationCallKinds))
      found = true;
  });
  return found;
};

const isProviderContext = node => {
  let current = node;
  while (current) {
    if (ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) {
      const tagName = ts.isJsxElement(current)
        ? current.openingElement.tagName.getText()
        : current.tagName.getText();
      if (PROVIDER_WORDS.test(tagName)) return true;
    }
    if (ts.isCallExpression(current)) {
      const name = callName(current.expression);
      if (PROVIDER_WORDS.test(name)) return true;
    }
    if (ts.isPropertyAccessExpression(current)) {
      if (PROVIDER_WORDS.test(current.name.text)) return true;
    }
    current = current.parent;
  }
  return false;
};

const isInternalContext = node => {
  let current = node;
  while (current) {
    if (ts.isCallExpression(current)) {
      const name = callName(current.expression).split('.').pop() ?? '';
      if (INTERNAL_WORDS.test(name)) return true;
    }
    current = current.parent;
  }
  return false;
};

const isStatusHelper = node => {
  let current = node;
  while (current) {
    if (
      (ts.isFunctionDeclaration(current) || ts.isMethodDeclaration(current)) &&
      current.name &&
      (ts.isIdentifier(current.name) || ts.isStringLiteral(current.name))
    ) {
      return /(?:state|status|branch|kind|type|route|category|severity|error)$/i.test(
        current.name.text
      );
    }
    if (
      ts.isVariableDeclaration(current) &&
      ts.isIdentifier(current.name) &&
      (ts.isArrowFunction(current.initializer) ||
        ts.isFunctionExpression(current.initializer))
    ) {
      return /(?:state|status|branch|kind|type|route|category|severity|error)$/i.test(
        current.name.text
      );
    }
    current = current.parent;
  }
  return false;
};

const isStyleContext = node => {
  let current = node;
  while (current) {
    if (ts.isVariableDeclaration(current)) {
      const name = identifierName(current.name);
      if (STYLE_NAMES.test(name)) return true;
    }
    if (
      ts.isPropertyAssignment(current) &&
      STYLE_NAMES.test(propertyName(current))
    ) {
      return true;
    }
    if (ts.isCallExpression(current)) {
      const name = callName(current.expression);
      if (name === 'StyleSheet.create' || name.endsWith('.createStyles')) {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
};

const isAllowlistedMachineToken = (file, value, sink) =>
  MACHINE_TOKEN_ALLOWLIST.get(file)?.get(sink)?.has(value) ?? false;

const staticStringVariants = node => {
  if (!node) return [];
  if (ts.isStringLiteralLike(node)) return [node.text];
  if (ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
  if (ts.isParenthesizedExpression(node)) {
    return staticStringVariants(node.expression);
  }
  if (ts.isConditionalExpression(node)) {
    return [
      ...staticStringVariants(node.whenTrue),
      ...staticStringVariants(node.whenFalse),
    ];
  }
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = staticStringVariants(node.left);
    const right = staticStringVariants(node.right);
    if (left.length && right.length) {
      return left.flatMap(a => right.map(b => `${a}${b}`));
    }
    if (left.length && !containsTranslationCall(node.right)) {
      return left.map(value => `${value}{expression}`);
    }
    if (right.length && !containsTranslationCall(node.left)) {
      return right.map(value => `{expression}${value}`);
    }
  }
  return [];
};

const isCopyVariable = (node, file) => {
  if (!ts.isVariableDeclaration(node)) return false;
  if (!/^app\/(?:onboarding|groups\/\[id\])\.tsx$/.test(file)) return false;
  const name = identifierName(node.name);
  return Boolean(name && COPY_VARIABLE_NAMES.test(name));
};

const isTechnicalProperty = node => {
  let current = node.parent;
  while (current) {
    if (ts.isPropertyAssignment(current)) {
      const key = propertyName(current);
      if (TECHNICAL_PROPERTY_NAMES.has(key)) return true;
      return false;
    }
    if (
      ts.isVariableDeclaration(current) ||
      ts.isJsxAttribute(current) ||
      ts.isCallExpression(current)
    ) {
      return false;
    }
    current = current.parent;
  }
  return false;
};

const deepStaticStringVariants = (node, translationCallKinds = null) => {
  const values = [];
  const visit = current => {
    if (!current || isTechnicalProperty(current)) return;
    if (isTranslationCall(current, translationCallKinds)) return;
    if (ts.isStringLiteralLike(current)) {
      const parent = current.parent;
      const machineComparison =
        parent &&
        ts.isBinaryExpression(parent) &&
        [
          ts.SyntaxKind.EqualsEqualsToken,
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsToken,
          ts.SyntaxKind.ExclamationEqualsEqualsToken,
        ].includes(parent.operatorToken.kind);
      if (!machineComparison) values.push(current.text);
    } else if (ts.isTemplateExpression(current)) {
      values.push(...staticStringVariants(current));
      return;
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return values;
};

const enclosingFunctionName = node => {
  let current = node.parent;
  while (current) {
    if (
      (ts.isFunctionDeclaration(current) ||
        ts.isMethodDeclaration(current) ||
        ts.isArrowFunction(current) ||
        ts.isFunctionExpression(current)) &&
      current.name &&
      (ts.isIdentifier(current.name) || ts.isStringLiteral(current.name))
    ) {
      return current.name.text;
    }
    if (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name)) {
      return current.name.text;
    }
    current = current.parent;
  }
  return '';
};

const hasLetters = value => /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value);

const looksLikeNonCopy = value => {
  const text = normalise(value);
  return (
    !text ||
    !hasLetters(text) ||
    /^(?:https?:|mailto:|tel:|menta:|[A-Z0-9_./:#?&=%-]{4,})$/.test(text) ||
    /^(?:[a-z]+:)?\/\//i.test(text)
  );
};

const expressionIsStaticKey = node =>
  Boolean(
    node &&
    (ts.isStringLiteralLike(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      (ts.isParenthesizedExpression(node) &&
        expressionIsStaticKey(node.expression)))
  );

const staticKeyValue = node => {
  if (!node) return null;
  if (
    ts.isStringLiteralLike(node) ||
    ts.isNoSubstitutionTemplateLiteral(node)
  ) {
    return node.text;
  }
  if (ts.isParenthesizedExpression(node))
    return staticKeyValue(node.expression);
  return null;
};

const expressionHasConstruction = node => {
  if (!node) return false;
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    return true;
  }
  if (ts.isTemplateExpression(node)) return true;
  if (ts.isCallExpression(node)) return true;
  return false;
};

const placeholders = value => {
  const counts = new Map();
  for (const match of String(value).matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)) {
    counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort());
};

const equalJson = (left, right) =>
  JSON.stringify(left) === JSON.stringify(right);

const createFinding = (sourceFile, node, category, message, extra = {}) => ({
  category,
  file: sourceFile.fileName,
  line: lineOf(sourceFile, node.getStart(sourceFile)),
  message,
  severity: extra.severity ?? 'error',
  text: extra.text,
  key: extra.key,
});

const extractSourceFindings = (file, source) => {
  const scriptKind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  const findings = [];
  const translationKeys = [];
  const seenFragments = new Set();
  const seenDynamicKeys = new Set();
  const seenSourceLiterals = new Set();
  const isCopyHelper =
    file.startsWith('lib/') &&
    COPY_HELPER_FILE.test(file) &&
    !TECHNICAL_HELPER_FILES.has(file);

  const translationCallKinds = new Map([
    ['t', 't'],
    ['translate', 'translate'],
    ['localise', 'localise'],
  ]);
  ts.forEachChild(sourceFile, node => {
    if (!ts.isImportDeclaration(node)) return;
    const moduleName = node.moduleSpecifier.text;
    if (
      !moduleName.endsWith('/localization') &&
      !moduleName.endsWith('/localization/translate')
    ) {
      return;
    }
    if (
      !node.importClause?.namedBindings ||
      !ts.isNamedImports(node.importClause.namedBindings)
    ) {
      return;
    }
    for (const specifier of node.importClause.namedBindings.elements) {
      const imported = specifier.propertyName?.text ?? specifier.name.text;
      if (
        imported === 'translate' ||
        imported === 'localise' ||
        imported === 't'
      ) {
        translationCallKinds.set(specifier.name.text, imported);
      }
    }
  });

  const addLiteral = (node, text, category, sink, tag = '') => {
    const value = normalise(text);
    const sourceLiteralId = `${category}:${node.getStart(sourceFile)}:${value}`;
    if (
      looksLikeNonCopy(value) ||
      isAllowlistedMachineToken(file, value, sink) ||
      isProviderContext(node) ||
      isInternalContext(node) ||
      isStyleContext(node) ||
      (tag && /^(?:Image|Icon|Svg|Path|LinearGradient|WebView)$/i.test(tag))
    ) {
      return;
    }
    if (seenSourceLiterals.has(sourceLiteralId)) return;
    seenSourceLiterals.add(sourceLiteralId);
    findings.push(
      createFinding(
        sourceFile,
        node,
        category,
        `Direct display copy must use t(): ${value}`,
        {
          text: value,
          key: sink,
        }
      )
    );
  };

  const addTranslationCall = node => {
    if (!isTranslationCall(node, translationCallKinds)) return;
    const keyNode = translationKeyArgument(node, translationCallKinds);
    if (!keyNode) return;
    if (expressionIsStaticKey(keyNode)) {
      const key = staticKeyValue(keyNode);
      if (key === null) return;
      translationKeys.push({
        file: sourceFile.fileName,
        line: lineOf(sourceFile, keyNode.getStart(sourceFile)),
        key,
      });
      return;
    }
    const keyText = keyNode.getText(sourceFile);
    const category = expressionHasConstruction(keyNode)
      ? 'dynamic-translation-key'
      : 'dynamic-translation-lookup';
    if (
      category === 'dynamic-translation-lookup' &&
      TRANSLATION_WRAPPER_NAMES.has(enclosingFunctionName(node))
    ) {
      return;
    }
    const id = `${sourceFile.fileName}:${keyNode.getStart(sourceFile)}:${category}`;
    if (seenDynamicKeys.has(id)) return;
    seenDynamicKeys.add(id);
    findings.push(
      createFinding(
        sourceFile,
        keyNode,
        category,
        `Translation key is not statically provable: ${keyText}`,
        {
          key: keyText,
          severity:
            category === 'dynamic-translation-key' ? 'error' : 'warning',
        }
      )
    );
  };

  const addFragment = node => {
    if (!containsTranslationCall(node, translationCallKinds)) return;
    const id = `${sourceFile.fileName}:${node.getStart(sourceFile)}`;
    if (seenFragments.has(id)) return;
    seenFragments.add(id);
    findings.push(
      createFinding(
        sourceFile,
        node,
        'translated-fragment',
        'Translated output is concatenated with source text; translate the complete sentence.',
        { key: node.getText(sourceFile) }
      )
    );
  };

  const visit = node => {
    if (isProviderContext(node) || isStyleContext(node)) {
      // Keep traversing for translation calls: a provider/style object can
      // still contain an accidental dynamic key, but ignore its display copy.
    }

    if (ts.isCallExpression(node)) {
      addTranslationCall(node);
      const name = callName(node.expression);
      const feedback =
        FEEDBACK_CALLS.has(name) ||
        /^(?:showToast|Toast)\.(?:success|error|info|warning)$/.test(name) ||
        name.endsWith('.alert') ||
        name.endsWith('.announceForAccessibility');
      if (feedback && !isProviderContext(node)) {
        for (const argument of node.arguments.slice(0, 3)) {
          if (containsTranslationCall(argument, translationCallKinds)) continue;
          for (const text of staticStringVariants(argument)) {
            addLiteral(argument, text, 'feedback-copy', name);
          }
        }
      }
      if (CUSTOMER_COPY_SETTERS.has(name) && !isProviderContext(node)) {
        for (const text of deepStaticStringVariants(
          node.arguments[0],
          translationCallKinds
        )) {
          addLiteral(node.arguments[0], text, 'customer-copy', name);
        }
      }
    }

    if (ts.isReturnStatement(node) && node.expression) {
      const functionNameText = enclosingFunctionName(node);
      const copyReturn =
        isCopyHelper ||
        (!TECHNICAL_HELPER_FILES.has(file) &&
          functionNameText &&
          COPY_VARIABLE_NAMES.test(functionNameText));
      if (!copyReturn || isStatusHelper(node)) {
        ts.forEachChild(node, visit);
        return;
      }
      if (!containsTranslationCall(node.expression, translationCallKinds)) {
        const variants = isCopyHelper
          ? staticStringVariants(node.expression)
          : deepStaticStringVariants(node.expression, translationCallKinds);
        for (const text of variants) {
          addLiteral(node.expression, text, 'helper-return', 'return');
        }
      }
    }
    if (
      ts.isArrowFunction(node) &&
      (isCopyHelper ||
        (node.parent &&
          ts.isVariableDeclaration(node.parent) &&
          isCopyVariable(node.parent, file))) &&
      !isStatusHelper(node) &&
      !ts.isBlock(node.body) &&
      !containsTranslationCall(node.body, translationCallKinds)
    ) {
      for (const text of staticStringVariants(node.body)) {
        addLiteral(node.body, text, 'helper-return', 'return');
      }
    }

    if (
      ts.isVariableDeclaration(node) &&
      isCopyVariable(node, file) &&
      node.initializer &&
      !containsTranslationCall(node.initializer, translationCallKinds)
    ) {
      for (const text of deepStaticStringVariants(
        node.initializer,
        translationCallKinds
      )) {
        addLiteral(
          node.initializer,
          text,
          'copy-variable',
          identifierName(node.name)
        );
      }
    }

    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      const parentIsConcatenation =
        (ts.isBinaryExpression(node.parent) &&
          node.parent.operatorToken.kind === ts.SyntaxKind.PlusToken) ||
        ts.isTemplateExpression(node.parent);
      if (
        containsTranslationCall(node, translationCallKinds) &&
        !parentIsConcatenation
      ) {
        addFragment(node);
      }
    }
    if (
      ts.isTemplateExpression(node) &&
      containsTranslationCall(node, translationCallKinds)
    ) {
      if (!ts.isTemplateExpression(node.parent)) addFragment(node);
    }

    if (ts.isJsxText(node)) {
      addLiteral(
        node,
        node.getText(sourceFile),
        'jsx-text',
        '',
        jsxTagName(node)
      );
    } else if (ts.isJsxAttribute(node)) {
      const attribute = node.name.text;
      if (USER_FACING_ATTRIBUTES.has(attribute) && !isProviderContext(node)) {
        const initializer = node.initializer;
        if (ts.isStringLiteral(initializer)) {
          addLiteral(
            node,
            initializer.text,
            'jsx-attribute',
            attribute,
            jsxTagName(node)
          );
        } else if (ts.isJsxExpression(initializer) && initializer.expression) {
          if (!containsTranslationCall(initializer.expression)) {
            for (const text of staticStringVariants(initializer.expression)) {
              addLiteral(
                node,
                text,
                'jsx-attribute',
                attribute,
                jsxTagName(node)
              );
            }
          }
        }
      }
    } else if (ts.isPropertyAssignment(node)) {
      const key = propertyName(node);
      const persistedCopyField =
        key === 'verificationDescription' || key === 'submissionText';
      if (
        USER_FACING_KEYS.has(key) &&
        (!persistedCopyField || file === 'app/onboarding.tsx') &&
        !isProviderContext(node) &&
        !isInternalContext(node) &&
        !isStyleContext(node)
      ) {
        if (!containsTranslationCall(node.initializer, translationCallKinds)) {
          const variants =
            key === 'verificationDescription' || key === 'submissionText'
              ? deepStaticStringVariants(node.initializer, translationCallKinds)
              : staticStringVariants(node.initializer);
          for (const text of variants) {
            addLiteral(node, text, 'display-property', key);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return { findings, sourceFile, translationKeys };
};

const walk = directory => {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) files.push(absolute);
  }
  return files;
};

const sourceFiles = () =>
  PRODUCTION_ROOTS.flatMap(root => walk(path.join(ROOT, root)))
    .map(relative)
    .filter(file => !isExcluded(file))
    .sort();

const parseCatalogueFile = (file, source) => {
  const scriptKind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  const entries = [];
  const visit = node => {
    if (ts.isPropertyAssignment(node)) {
      const key = propertyName(node);
      const values = staticStringVariants(node.initializer);
      if (key && values.length === 1) {
        entries.push({
          key,
          value: values[0],
          file,
          line: lineOf(sourceFile, node.getStart(sourceFile)),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return entries;
};

const unwrapCatalogueExpression = expression => {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
};

const parseCatalogueExport = (file, source, exportName) => {
  const scriptKind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  let objectLiteral = null;
  const findExport = node => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === exportName &&
      node.initializer
    ) {
      const initializer = unwrapCatalogueExpression(node.initializer);
      if (ts.isObjectLiteralExpression(initializer))
        objectLiteral = initializer;
    }
    if (!objectLiteral) ts.forEachChild(node, findExport);
  };
  findExport(sourceFile);
  if (!objectLiteral) return [];

  const entries = [];
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyName(property);
    const values = staticStringVariants(property.initializer);
    if (key && values.length === 1) {
      entries.push({
        key,
        value: values[0],
        file,
        line: lineOf(sourceFile, property.getStart(sourceFile)),
      });
    }
  }
  return entries;
};

const resolveSharedCatalogueModule = (ownerFile, moduleSpecifier) => {
  const aliasPrefix = '@/lib/localization/catalogues/shared/';
  let candidate = null;
  if (moduleSpecifier.startsWith(aliasPrefix)) {
    candidate = `lib/localization/catalogues/shared/${moduleSpecifier.slice(aliasPrefix.length)}`;
  } else if (moduleSpecifier.startsWith('.')) {
    candidate = path
      .normalize(path.join(path.dirname(ownerFile), moduleSpecifier))
      .split(path.sep)
      .join('/');
  }
  if (!candidate) return null;
  if (!/\.[cm]?[jt]sx?$/.test(candidate)) candidate += '.ts';
  return candidate.startsWith('lib/localization/catalogues/shared/')
    ? candidate
    : null;
};

const readImportedSharedCatalogueEntries = files => {
  const entries = [];
  const seenCompositionUnits = new Set();
  for (const ownerFile of files) {
    const ownerSource = fs.readFileSync(path.join(ROOT, ownerFile), 'utf8');
    const ownerSourceFile = ts.createSourceFile(
      ownerFile,
      ownerSource,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
    const sharedImports = new Map();
    for (const statement of ownerSourceFile.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier)
      )
        continue;
      const sharedFile = resolveSharedCatalogueModule(
        ownerFile,
        statement.moduleSpecifier.text
      );
      const bindings = statement.importClause?.namedBindings;
      if (!sharedFile || !bindings || !ts.isNamedImports(bindings)) continue;
      for (const element of bindings.elements) {
        sharedImports.set(element.name.text, {
          exportName: element.propertyName?.text ?? element.name.text,
          file: sharedFile,
        });
      }
    }

    const visit = node => {
      if (ts.isSpreadAssignment(node) && ts.isIdentifier(node.expression)) {
        const imported = sharedImports.get(node.expression.text);
        if (imported) {
          const compositionUnit = `${imported.file}#${imported.exportName}`;
          if (!seenCompositionUnits.has(compositionUnit)) {
            seenCompositionUnits.add(compositionUnit);
            const absolute = path.join(ROOT, imported.file);
            if (fs.existsSync(absolute)) {
              entries.push(
                ...parseCatalogueExport(
                  imported.file,
                  fs.readFileSync(absolute, 'utf8'),
                  imported.exportName
                ).map(entry => ({
                  ...entry,
                  fromSharedImport: true,
                  sharedCompositionUnit: compositionUnit,
                }))
              );
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(ownerSourceFile);
  }
  return entries;
};

const catalogueFiles = () => {
  const directory = path.join(ROOT, 'lib/localization/catalogues');
  if (!fs.existsSync(directory)) return [];
  return walk(directory)
    .filter(file => /\.ts$/.test(file))
    .map(relative)
    .sort();
};

const readCatalogueEntries = (files, locale) => {
  // Shared modules are not catalogues in their own right. Attribute only the
  // named exports that the locale actually spreads into its composed object.
  // Read them first so an explicit regional spread can intentionally override
  // neutral shared copy, matching JavaScript object-spread semantics.
  const entries = readImportedSharedCatalogueEntries(files);
  for (const file of files) {
    if (file.startsWith('lib/localization/catalogues/shared/')) continue;
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    entries.push(...parseCatalogueFile(file, source));
  }
  // `lib/localization/en-NZ.ts` contains foundation keys in addition to its
  // `catalogues/en-NZ/` journey modules. Include it only for the canonical
  // source; regional catalogues are represented by their root and modules.
  if (locale === 'en-NZ') {
    const foundation = 'lib/localization/en-NZ.ts';
    if (fs.existsSync(path.join(ROOT, foundation))) {
      entries.push(
        ...parseCatalogueFile(
          foundation,
          fs.readFileSync(path.join(ROOT, foundation), 'utf8')
        )
      );
    }
  }
  return entries;
};

const buildCatalogues = () => {
  const files = catalogueFiles();
  const localeNames = new Set();
  for (const file of files) {
    const match = file.match(/^lib\/localization\/catalogues\/([^/]+)\.ts$/);
    if (match) localeNames.add(match[1]);
    const directoryMatch = file.match(
      /^lib\/localization\/catalogues\/([^/]+)\/[^/]+\.ts$/
    );
    if (directoryMatch && directoryMatch[1] !== 'shared')
      localeNames.add(directoryMatch[1]);
  }
  if (fs.existsSync(path.join(ROOT, 'lib/localization/en-NZ.ts')))
    localeNames.add('en-NZ');

  const catalogues = {};
  const duplicates = [];
  for (const locale of [...localeNames].sort()) {
    const localeFiles = files.filter(
      file =>
        file === `lib/localization/catalogues/${locale}.ts` ||
        file.startsWith(`lib/localization/catalogues/${locale}/`)
    );
    const entries = readCatalogueEntries(localeFiles, locale);
    const values = {};
    const first = new Map();
    for (const entry of entries) {
      if (first.has(entry.key)) {
        const previous = first.get(entry.key);
        const intentionalSharedOverride =
          previous.fromSharedImport &&
          (!entry.fromSharedImport ||
            previous.sharedCompositionUnit !== entry.sharedCompositionUnit);
        if (intentionalSharedOverride) {
          // The later spread now owns the key. Remember it so another regional
          // module declaring the same key is still reported as a duplicate.
          first.set(entry.key, entry);
        } else {
          duplicates.push({
            category: 'duplicate-catalogue-key',
            file: entry.file,
            line: entry.line,
            message: `Duplicate catalogue key ${entry.key}; first declared at ${previous.file}:${previous.line}.`,
            severity: 'error',
            key: entry.key,
          });
        }
      } else {
        first.set(entry.key, entry);
      }
      values[entry.key] = entry.value;
    }
    catalogues[locale] = { entries, values };
  }
  return { catalogues, duplicates };
};

const compareCatalogues = ({ catalogues, duplicates }) => {
  const canonical = catalogues['en-NZ']?.values ?? {};
  const canonicalKeys = new Set(Object.keys(canonical));
  const findings = [...duplicates];
  const parity = {};
  const pluralGroups = {};

  if (!canonicalKeys.size) {
    findings.push({
      category: 'missing-canonical-catalogue',
      file: 'lib/localization/en-NZ.ts',
      line: 1,
      message: 'The canonical en-NZ catalogue is missing or contains no keys.',
      severity: 'error',
    });
  }

  for (const key of canonicalKeys) {
    const match = key.match(/^(.*)\.(zero|one|two|few|many|other)$/);
    if (match) {
      pluralGroups[match[1]] ??= new Set();
      pluralGroups[match[1]].add(match[2]);
    }
  }

  for (const [locale, catalogue] of Object.entries(catalogues)) {
    const values = catalogue.values;
    const keys = new Set(Object.keys(values));
    const missing = [...canonicalKeys].filter(key => !keys.has(key)).sort();
    const extra = [...keys].filter(key => !canonicalKeys.has(key)).sort();
    const placeholderMismatches = [];

    for (const key of [...canonicalKeys]
      .filter(candidate => keys.has(candidate))
      .sort()) {
      const expected = placeholders(canonical[key]);
      const actual = placeholders(values[key]);
      if (!equalJson(expected, actual)) {
        placeholderMismatches.push({
          key,
          english: expected,
          locale: actual,
        });
        findings.push({
          category: 'placeholder-parity',
          file: `lib/localization/catalogues/${locale}.ts`,
          line: 1,
          message: `Placeholder mismatch for ${key}: English ${JSON.stringify(expected)}, ${locale} ${JSON.stringify(actual)}.`,
          severity: 'error',
          key,
        });
      }
    }

    for (const key of missing) {
      findings.push({
        category: 'catalogue-fallback',
        file: `lib/localization/catalogues/${locale}.ts`,
        line: 1,
        message: `${locale} is missing ${key}; runtime translation falls back to en-NZ.`,
        severity:
          (OPTIONAL_DYNAMIC_SOURCE_KEY.test(key) ||
            OPTIONAL_REGIONAL_VARIANT_KEY.test(key)) &&
          locale !== 'de-DE'
            ? 'warning'
            : 'error',
        key,
      });
    }
    for (const key of extra) {
      findings.push({
        category: 'catalogue-extra-key',
        file: `lib/localization/catalogues/${locale}.ts`,
        line: 1,
        message: `${locale} declares ${key}, but en-NZ does not.`,
        severity: 'error',
        key,
      });
    }
    for (const [key, value] of Object.entries(values)) {
      if (value.trim() === key) {
        findings.push({
          category: 'raw-catalogue-key',
          file: `lib/localization/catalogues/${locale}.ts`,
          line: 1,
          message: `${locale} value for ${key} is the raw key.`,
          severity: 'error',
          key,
        });
      }
    }

    const plural = {};
    for (const [base, expectedSet] of Object.entries(pluralGroups)) {
      const expected = [...expectedSet].sort();
      const actual = Object.keys(values)
        .filter(key => key.startsWith(`${base}.`))
        .map(key => key.slice(base.length + 1))
        .filter(category => /^(?:zero|one|two|few|many|other)$/.test(category))
        .sort();
      plural[base] = { expected, actual };
      if (!equalJson(expected, actual)) {
        const optionalRegionalPlural =
          OPTIONAL_DYNAMIC_SOURCE_KEY.test(`${base}.one`) ||
          OPTIONAL_REGIONAL_VARIANT_KEY.test(`${base}.one`);
        findings.push({
          category: 'plural-parity',
          file: `lib/localization/catalogues/${locale}.ts`,
          line: 1,
          message: `${locale} plural categories for ${base} are ${actual.join(', ') || 'none'}; expected ${expected.join(', ')}.`,
          severity:
            optionalRegionalPlural && locale !== 'de-DE' ? 'warning' : 'error',
          key: base,
        });
      }
    }
    parity[locale] = {
      keys: keys.size,
      missing,
      extra,
      placeholderMismatches,
      plural,
    };
  }

  return { findings, parity, canonicalKeyCount: canonicalKeys.size };
};

const run = () => {
  const findings = [];
  const translationKeys = [];
  const scanned = sourceFiles();
  for (const file of scanned) {
    const absolute = path.join(ROOT, file);
    const { findings: sourceFindings, translationKeys: sourceKeys } =
      extractSourceFindings(file, fs.readFileSync(absolute, 'utf8'));
    findings.push(...sourceFindings);
    translationKeys.push(...sourceKeys);
  }

  const catalogues = buildCatalogues();
  const comparison = compareCatalogues(catalogues);
  findings.push(...comparison.findings);
  const canonicalKeys = new Set(
    Object.keys(catalogues.catalogues['en-NZ']?.values ?? {})
  );
  for (const usage of translationKeys) {
    if (canonicalKeys.has(usage.key)) continue;
    findings.push({
      category: 'missing-translation-key',
      file: usage.file,
      line: usage.line,
      message: `Translation key ${usage.key} is not present in en-NZ; this lookup can return a raw key or undefined copy.`,
      severity: 'error',
      key: usage.key,
    });
  }
  findings.sort(
    (left, right) =>
      String(left.file).localeCompare(String(right.file)) ||
      Number(left.line ?? 0) - Number(right.line ?? 0) ||
      left.category.localeCompare(right.category) ||
      String(left.key ?? '').localeCompare(String(right.key ?? ''))
  );

  const counts = {};
  for (const finding of findings)
    counts[finding.category] = (counts[finding.category] ?? 0) + 1;
  const errors = findings.filter(finding => finding.severity === 'error');
  const warnings = findings.filter(finding => finding.severity === 'warning');
  return {
    version: 1,
    root: ROOT,
    scannedFiles: scanned.length,
    summary: {
      findings: findings.length,
      errors: errors.length,
      warnings: warnings.length,
      categories: counts,
    },
    catalogues: {
      canonicalLocale: 'en-NZ',
      locales: Object.keys(catalogues.catalogues).sort(),
      canonicalKeyCount: comparison.canonicalKeyCount,
      parity: comparison.parity,
    },
    findings,
  };
};

const report = run();
if (JSON_OUTPUT) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(
    [
      `Localisation completeness: ${report.summary.errors} errors, ${report.summary.warnings} warnings`,
      `Scanned ${report.scannedFiles} production source files; canonical catalogue has ${report.catalogues.canonicalKeyCount} keys.`,
      ...Object.entries(report.summary.categories)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([category, count]) => `- ${category}: ${count}`),
    ].join('\n') + '\n'
  );
  for (const finding of report.findings.slice(0, 40)) {
    process.stdout.write(
      `${finding.severity.toUpperCase()} ${finding.category} ${finding.file}:${finding.line} ${finding.message}\n`
    );
  }
  if (report.findings.length > 40) {
    process.stdout.write(
      `… ${report.findings.length - 40} additional findings (use --json for the full report)\n`
    );
  }
}

if (!NO_FAIL && report.summary.errors > 0) process.exitCode = 1;
