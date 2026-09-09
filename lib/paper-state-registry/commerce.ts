export type CommercePaperRoute =
  | 'paywall'
  | 'momenta'
  | 'shop'
  | 'shop-detail'
  | 'inventory';

export type CommercePaperTone =
  | 'neutral'
  | 'action'
  | 'success'
  | 'warning'
  | 'danger';

export type CommercePaperKind =
  | 'gate'
  | 'loading'
  | 'plans'
  | 'handoff'
  | 'receipt'
  | 'ledger'
  | 'catalogue'
  | 'product'
  | 'inventory'
  | 'reward';

export type CommercePaperAction = {
  id: string;
  label: string;
  disabled?: boolean;
  emphasis?: 'primary' | 'secondary' | 'quiet';
};

export type CommercePaperFact = {
  label: string;
  value: string;
};

export type CommercePaperPriceSlot = 'monthly' | 'annual' | 'reserve';

export type CommercePaperState = {
  id: string;
  paperNodeId: string;
  route: CommercePaperRoute;
  kind: CommercePaperKind;
  tone: CommercePaperTone;
  eyebrow: string;
  title: string;
  detail: string;
  proofBoundary: string;
  facts: readonly CommercePaperFact[];
  priceSlots?: readonly CommercePaperPriceSlot[];
  primaryAction: CommercePaperAction;
  secondaryAction?: CommercePaperAction;
};

/**
 * The complete live-Paper Commerce block. Values are deterministic gallery
 * fixtures only. Real routes must replace every price, balance, entitlement,
 * ownership and receipt fact with the current account or store readback.
 */
export const COMMERCE_FAMILY_PAPER_STATES = [
  {
    id: 'PAY-01',
    paperNodeId: '1EE-0',
    route: 'paywall',
    kind: 'gate',
    tone: 'warning',
    eyebrow: 'FREE PLAN LIMIT',
    title: 'Your draft is still here.',
    detail:
      'Nothing has been lost. See what Pro changes, or return to the saved draft now.',
    proofBoundary: 'The draft remains authoritative until the user leaves it.',
    facts: [
      { label: 'Promise draft', value: 'Saved' },
      { label: 'Upgrade', value: 'Not started' },
    ],
    primaryAction: { id: 'see-pro', label: 'See Pro' },
    secondaryAction: {
      id: 'not-now',
      label: 'Not now',
      emphasis: 'quiet',
    },
  },
  {
    id: 'PAY-02',
    paperNodeId: '16R-0',
    route: 'paywall',
    kind: 'loading',
    tone: 'neutral',
    eyebrow: 'MENTA PRO',
    title: 'Loading live plans.',
    detail: 'Prices come directly from the App Store through RevenueCat.',
    proofBoundary: 'No checkout action exists until a live package is loaded.',
    facts: [],
    priceSlots: ['monthly', 'annual'],
    primaryAction: {
      id: 'plans-loading',
      label: 'Loading plans…',
      disabled: true,
    },
  },
  {
    id: 'PAY-03A',
    paperNodeId: 'TM-0',
    route: 'paywall',
    kind: 'plans',
    tone: 'action',
    eyebrow: 'CHOOSE A PLAN',
    title: 'More room to follow through.',
    detail: 'No plan is selected until the person chooses one.',
    proofBoundary: 'Displayed prices must come from the current live offering.',
    facts: [
      { label: 'Monthly', value: 'Live App Store price' },
      { label: 'Annual', value: 'Live App Store price' },
    ],
    priceSlots: ['monthly', 'annual'],
    primaryAction: {
      id: 'choose-plan',
      label: 'Choose a plan to continue',
      disabled: true,
    },
    secondaryAction: {
      id: 'restore',
      label: 'Restore purchases',
      emphasis: 'secondary',
    },
  },
  {
    id: 'PAY-03B',
    paperNodeId: 'Y4-0',
    route: 'paywall',
    kind: 'plans',
    tone: 'action',
    eyebrow: 'MONTHLY SELECTED',
    title: 'More room to follow through.',
    detail: 'Monthly is selected with a direct row, not a decorative card.',
    proofBoundary: 'Selection does not start checkout or activate Pro.',
    facts: [
      { label: 'Monthly', value: 'Selected' },
      { label: 'Annual', value: 'Available' },
    ],
    priceSlots: ['monthly', 'annual'],
    primaryAction: { id: 'buy-monthly', label: 'Continue with monthly' },
    secondaryAction: {
      id: 'restore',
      label: 'Restore purchases',
      emphasis: 'secondary',
    },
  },
  {
    id: 'PAY-04A',
    paperNodeId: '106-0',
    route: 'paywall',
    kind: 'handoff',
    tone: 'neutral',
    eyebrow: 'APPLE CHECKOUT',
    title: 'Opening Apple checkout.',
    detail: 'Apple owns the product, price and confirmation controls.',
    proofBoundary: 'Opening the system sheet does not activate Pro.',
    facts: [
      { label: 'Apple handoff', value: 'Opening' },
      { label: 'Menta access', value: 'Unchanged' },
    ],
    primaryAction: {
      id: 'opening-store',
      label: 'Waiting for Apple…',
      disabled: true,
    },
  },
  {
    id: 'PAY-04B',
    paperNodeId: '1FY-0',
    route: 'paywall',
    kind: 'handoff',
    tone: 'neutral',
    eyebrow: 'SYSTEM UI BOUNDARY',
    title: 'Native purchase sheet.',
    detail: 'Apple renders the live product and confirmation outside Menta.',
    proofBoundary: 'Menta never recreates or overrides the native checkout.',
    facts: [
      { label: 'Live product and terms', value: 'Apple-owned' },
      { label: 'Confirmation control', value: 'Apple-owned' },
    ],
    primaryAction: {
      id: 'system-sheet',
      label: 'System sheet is external',
      disabled: true,
    },
  },
  {
    id: 'PAY-04C',
    paperNodeId: '1IU-0',
    route: 'paywall',
    kind: 'receipt',
    tone: 'neutral',
    eyebrow: 'NO STATE CHANGE',
    title: 'Purchase cancelled.',
    detail: 'Apple checkout closed without a confirmed purchase.',
    proofBoundary: 'Cancellation is not a failure and does not activate Pro.',
    facts: [
      { label: 'Apple checkout', value: 'Closed' },
      { label: 'Pro entitlement', value: 'Unchanged' },
    ],
    primaryAction: { id: 'back-to-plans', label: 'Choose a plan' },
    secondaryAction: {
      id: 'not-now',
      label: 'Not now',
      emphasis: 'quiet',
    },
  },
  {
    id: 'PAY-05',
    paperNodeId: '12G-0',
    route: 'paywall',
    kind: 'loading',
    tone: 'neutral',
    eyebrow: 'CHECKING ACCESS',
    title: 'Your purchase finished. Pro is catching up.',
    detail: 'Menta is refreshing the current RevenueCat entitlement.',
    proofBoundary: 'Do not repurchase while access is being checked.',
    facts: [
      { label: 'Store handoff', value: 'Returned' },
      { label: 'Pro access', value: 'Still checking' },
    ],
    primaryAction: {
      id: 'checking-access',
      label: 'Checking access…',
      disabled: true,
    },
  },
  {
    id: 'PAY-06',
    paperNodeId: '13X-0',
    route: 'paywall',
    kind: 'receipt',
    tone: 'success',
    eyebrow: 'PRO IS ACTIVE',
    title: 'More room. Same promises.',
    detail: 'Pro features are ready on the current account.',
    proofBoundary: 'Requires an active Pro entitlement readback.',
    facts: [
      { label: 'Entitlement', value: 'Account confirmed' },
      { label: 'Momenta renewal credit', value: 'Separate receipt' },
    ],
    primaryAction: { id: 'continue-pro', label: 'Start with Pro' },
  },
  {
    id: 'PAY-07',
    paperNodeId: '1KW-0',
    route: 'paywall',
    kind: 'receipt',
    tone: 'warning',
    eyebrow: 'STILL CHECKING',
    title: 'Your purchase finished, but Pro is not showing yet.',
    detail: 'Checking again will not charge you.',
    proofBoundary: 'Repurchase stays blocked while entitlement is unknown.',
    facts: [
      { label: 'Apple purchase', value: 'Returned' },
      { label: 'Menta Pro', value: 'Not confirmed' },
    ],
    primaryAction: { id: 'check-access', label: 'Check again' },
    secondaryAction: {
      id: 'restore',
      label: 'Restore purchase',
      emphasis: 'secondary',
    },
  },
  {
    id: 'PAY-08A',
    paperNodeId: '15G-0',
    route: 'paywall',
    kind: 'receipt',
    tone: 'danger',
    eyebrow: 'PRO NOT ACTIVE',
    title: 'Apple checkout did not finish.',
    detail: 'Check the purchase before trying again.',
    proofBoundary: 'If Apple shows a charge, restore before another purchase.',
    facts: [
      { label: 'Entitlement', value: 'Not confirmed' },
      { label: 'Repeat purchase', value: 'Check first' },
    ],
    primaryAction: { id: 'try-again', label: 'Try again' },
    secondaryAction: {
      id: 'restore',
      label: 'Restore purchases',
      emphasis: 'secondary',
    },
  },
  {
    id: 'PAY-08B',
    paperNodeId: '18U-0',
    route: 'paywall',
    kind: 'receipt',
    tone: 'danger',
    eyebrow: 'APP STORE UNAVAILABLE',
    title: 'Plans are not loading yet.',
    detail: 'No purchase started and no price is guessed.',
    proofBoundary: 'A live offering is required before checkout.',
    facts: [
      { label: 'Account', value: 'Unchanged' },
      { label: 'Checkout', value: 'Not started' },
    ],
    primaryAction: { id: 'retry-plans', label: 'Try again' },
    secondaryAction: {
      id: 'restore',
      label: 'Restore purchases',
      emphasis: 'secondary',
    },
  },
  {
    id: 'PAY-09A',
    paperNodeId: '1A5-0',
    route: 'paywall',
    kind: 'loading',
    tone: 'neutral',
    eyebrow: 'RESTORING PURCHASES',
    title: 'Checking your Apple purchases.',
    detail: 'Restore does not start a new purchase or charge the account.',
    proofBoundary: 'Duplicate restore requests remain disabled in flight.',
    facts: [
      { label: 'App Store', value: 'Checking' },
      { label: 'Menta access', value: 'Next' },
    ],
    primaryAction: {
      id: 'restoring',
      label: 'Checking purchases…',
      disabled: true,
    },
  },
  {
    id: 'PAY-09B',
    paperNodeId: '1BM-0',
    route: 'paywall',
    kind: 'receipt',
    tone: 'success',
    eyebrow: 'PURCHASE RESTORED',
    title: 'Pro is back.',
    detail: 'The previous Apple purchase is active on this account.',
    proofBoundary: 'Requires an active entitlement after restore.',
    facts: [
      { label: 'Pro access', value: 'Active' },
      { label: 'New charge', value: 'None' },
    ],
    primaryAction: { id: 'continue-restored', label: 'Continue' },
  },
  {
    id: 'PAY-09C',
    paperNodeId: '1CW-0',
    route: 'paywall',
    kind: 'receipt',
    tone: 'neutral',
    eyebrow: 'NOTHING TO RESTORE',
    title: 'No Pro purchase was found.',
    detail: 'Apple returned no active Menta Pro purchase for this account.',
    proofBoundary:
      'A completed empty restore is distinct from a failed restore.',
    facts: [
      { label: 'Apple restore', value: 'Completed' },
      { label: 'Active Pro', value: 'Not found' },
    ],
    primaryAction: { id: 'back-to-plans', label: 'Back to plans' },
    secondaryAction: {
      id: 'get-help',
      label: 'Get help',
      emphasis: 'secondary',
    },
  },
  {
    id: 'PAY-10',
    paperNodeId: '1MT-0',
    route: 'paywall',
    kind: 'handoff',
    tone: 'neutral',
    eyebrow: 'PRO ACTIVE',
    title: 'Manage your subscription.',
    detail: 'Apple handles plan changes and cancellation.',
    proofBoundary: 'Menta changes access only after Apple confirms an update.',
    facts: [
      { label: 'Current entitlement', value: 'Account confirmed' },
      { label: 'Management controls', value: 'Apple-owned' },
    ],
    primaryAction: {
      id: 'open-subscriptions',
      label: 'Open subscription settings',
    },
    secondaryAction: { id: 'back', label: 'Back', emphasis: 'quiet' },
  },
  {
    id: 'MOM-01',
    paperNodeId: '71J-0',
    route: 'momenta',
    kind: 'ledger',
    tone: 'neutral',
    eyebrow: 'MOMENTA WALLET',
    title: 'Your support balance.',
    detail: 'Earned and spent activity stays tied to the current account.',
    proofBoundary: 'Balance and ledger rows require an account-confirmed read.',
    facts: [
      { label: 'Available Momenta', value: 'Account confirmed' },
      { label: 'Recent activity', value: 'Server ledger' },
    ],
    primaryAction: { id: 'earn-momenta', label: 'Earn Momenta' },
    secondaryAction: {
      id: 'open-shop',
      label: 'Open shop',
      emphasis: 'secondary',
    },
  },
  {
    id: 'MOM-02',
    paperNodeId: '71M-0',
    route: 'momenta',
    kind: 'receipt',
    tone: 'warning',
    eyebrow: 'ACTION BLOCKED',
    title: 'Support is needed first.',
    detail: 'The promise draft remains while the shortfall is resolved.',
    proofBoundary: 'No purchase request or debit has been made.',
    facts: [
      { label: 'Current balance', value: 'Account confirmed' },
      { label: 'Attempted action', value: 'Not charged' },
    ],
    primaryAction: { id: 'earn-momenta', label: 'Earn Momenta' },
    secondaryAction: {
      id: 'see-pro',
      label: 'See Pro options',
      emphasis: 'secondary',
    },
  },
  {
    id: 'MOM-03',
    paperNodeId: '7BK-0',
    route: 'momenta',
    kind: 'loading',
    tone: 'neutral',
    eyebrow: 'SYNC IN PROGRESS',
    title: 'Refreshing your ledger.',
    detail: 'Menta is checking balance, owned items and recent activity.',
    proofBoundary: 'No unconfirmed balance is presented as current.',
    facts: [],
    primaryAction: {
      id: 'wallet-loading',
      label: 'Checking account…',
      disabled: true,
    },
  },
  {
    id: 'MOM-04',
    paperNodeId: '7BM-0',
    route: 'momenta',
    kind: 'receipt',
    tone: 'danger',
    eyebrow: 'BALANCE NOT CONFIRMED',
    title: 'We could not confirm your balance.',
    detail: 'The last number is not shown as current.',
    proofBoundary: 'A failed read is not zero balance or empty history.',
    facts: [
      { label: 'Balance sync', value: 'Did not finish' },
      { label: 'Account actions', value: 'Unchanged' },
    ],
    primaryAction: { id: 'retry-wallet', label: 'Try balance again' },
    secondaryAction: {
      id: 'return-today',
      label: 'Return to Today',
      emphasis: 'quiet',
    },
  },
  {
    id: 'MOM-05',
    paperNodeId: '9QH-0',
    route: 'momenta',
    kind: 'ledger',
    tone: 'neutral',
    eyebrow: 'LEDGER EMPTY',
    title: 'No activity yet.',
    detail: 'Transactions appear after the server records the first one.',
    proofBoundary: 'Empty requires a successful current-account history read.',
    facts: [{ label: 'Current truth', value: 'No ledger rows' }],
    primaryAction: { id: 'open-shop', label: 'Explore support items' },
    secondaryAction: { id: 'back', label: 'Back', emphasis: 'quiet' },
  },
  {
    id: 'TOP-01',
    paperNodeId: '7BN-0',
    route: 'momenta',
    kind: 'product',
    tone: 'action',
    eyebrow: 'ADD MOMENTA',
    title: 'Add a reserve, only if you want one.',
    detail: 'The App Store is the source of price and purchase confirmation.',
    proofBoundary: 'Checkout stays disabled without a live reserve-pack price.',
    facts: [
      { label: 'Reserve pack', value: 'Live App Store price' },
      { label: 'Momenta credit', value: 'Requires server receipt' },
    ],
    priceSlots: ['reserve'],
    primaryAction: { id: 'buy-reserve', label: 'Continue to App Store' },
    secondaryAction: {
      id: 'available-rewards',
      label: 'See available rewards',
      emphasis: 'secondary',
    },
  },
  {
    id: 'TOP-02',
    paperNodeId: '7BL-0',
    route: 'momenta',
    kind: 'receipt',
    tone: 'warning',
    eyebrow: 'PURCHASE ACKNOWLEDGED',
    title: 'Your receipt is being checked.',
    detail: 'Momenta is not available until the store receipt is processed.',
    proofBoundary: 'A StoreKit return is not a wallet credit receipt.',
    facts: [
      { label: 'App Store handoff', value: 'Returned' },
      { label: 'Balance update', value: 'Waiting' },
    ],
    primaryAction: { id: 'check-balance', label: 'Check balance again' },
    secondaryAction: {
      id: 'return-wallet',
      label: 'Return to wallet',
      emphasis: 'quiet',
    },
  },
  {
    id: 'SHP-01',
    paperNodeId: '71K-0',
    route: 'shop',
    kind: 'catalogue',
    tone: 'neutral',
    eyebrow: 'MOMENTA / SHOP',
    title: 'Spend with purpose.',
    detail: 'Open an item for the current server catalogue price.',
    proofBoundary: 'Nothing is owned until the server confirms purchase.',
    facts: [
      { label: 'Streak Freeze', value: 'Open for live cost' },
      { label: 'Time Extension', value: 'Open for live cost' },
      { label: 'Supported style', value: 'Open for live cost' },
    ],
    primaryAction: { id: 'view-inventory', label: 'View inventory' },
  },
  {
    id: 'SHP-02',
    paperNodeId: '7HP-0',
    route: 'shop-detail',
    kind: 'product',
    tone: 'neutral',
    eyebrow: 'POWER-UP · AUTO-APPLIED',
    title: 'Streak Freeze.',
    detail: 'A reserve for the next eligible one-day miss.',
    proofBoundary: 'Cost, balance and ownership are checked again before buy.',
    facts: [
      { label: 'Target promise', value: 'Not required' },
      { label: 'Ownership', value: 'Server confirmed after buy' },
    ],
    primaryAction: { id: 'see-live-cost', label: 'See live cost' },
    secondaryAction: {
      id: 'back-shop',
      label: 'Back to shop',
      emphasis: 'quiet',
    },
  },
  {
    id: 'SHP-03',
    paperNodeId: '7HO-0',
    route: 'inventory',
    kind: 'inventory',
    tone: 'action',
    eyebrow: 'APPLY BOOST',
    title: 'Choose where to use it.',
    detail: 'Selection does not apply the boost until the promise confirms it.',
    proofBoundary: 'Only current eligible promises may be selected.',
    facts: [
      { label: 'Morning run', value: 'Eligible fixture' },
      { label: 'Read before bed', value: 'Eligible fixture' },
    ],
    primaryAction: { id: 'select-promise', label: 'Select a promise' },
    secondaryAction: { id: 'cancel', label: 'Cancel', emphasis: 'quiet' },
  },
  {
    id: 'SHP-04',
    paperNodeId: '7HM-0',
    route: 'shop',
    kind: 'receipt',
    tone: 'danger',
    eyebrow: 'SHOP UNAVAILABLE',
    title: 'The current catalogue did not load.',
    detail: 'Nothing has been charged or changed.',
    proofBoundary: 'A failed catalogue read is not an empty shelf.',
    facts: [{ label: 'Accountability loop', value: 'Still available' }],
    primaryAction: { id: 'retry-shop', label: 'Retry shop' },
    secondaryAction: {
      id: 'return-today',
      label: 'Return to Today',
      emphasis: 'quiet',
    },
  },
  {
    id: 'SHP-05',
    paperNodeId: '9Q5-0',
    route: 'shop-detail',
    kind: 'product',
    tone: 'neutral',
    eyebrow: 'AVAILABLE',
    title: 'Streak Freeze.',
    detail: 'Protect one missed day without rewriting proof history.',
    proofBoundary: 'Server catalogue and current balance remain authoritative.',
    facts: [
      { label: 'Support item', value: 'One use' },
      { label: 'Momenta cost', value: 'Current catalogue' },
    ],
    primaryAction: { id: 'buy-item', label: 'Buy with Momenta' },
    secondaryAction: {
      id: 'back-shop',
      label: 'Back to shop',
      emphasis: 'quiet',
    },
  },
  {
    id: 'SHP-06',
    paperNodeId: '9Q6-0',
    route: 'shop-detail',
    kind: 'receipt',
    tone: 'warning',
    eyebrow: 'CONFIRM PURCHASE',
    title: 'Use Momenta?',
    detail: 'The expected balance is shown before the mutation.',
    proofBoundary: 'Holding confirms intent, not server completion.',
    facts: [
      { label: 'Current balance', value: 'Account confirmed' },
      { label: 'Balance after', value: 'Expected only' },
    ],
    primaryAction: { id: 'hold-confirm', label: 'Hold to confirm' },
    secondaryAction: { id: 'not-now', label: 'Not now', emphasis: 'quiet' },
  },
  {
    id: 'SHP-07',
    paperNodeId: '9Q7-0',
    route: 'shop-detail',
    kind: 'loading',
    tone: 'warning',
    eyebrow: 'SERVER RECEIPT PENDING',
    title: 'Completing purchase.',
    detail: 'Menta is checking the debit and inventory grant.',
    proofBoundary:
      'Duplicate submit is blocked until the result is classified.',
    facts: [
      { label: 'Purchase request', value: 'In flight' },
      { label: 'Owned item', value: 'Not confirmed' },
    ],
    primaryAction: {
      id: 'purchase-pending',
      label: 'Please wait',
      disabled: true,
    },
  },
  {
    id: 'SHP-08',
    paperNodeId: '9Q8-0',
    route: 'shop-detail',
    kind: 'receipt',
    tone: 'success',
    eyebrow: 'PURCHASE CONFIRMED',
    title: 'Item added to your kit.',
    detail: 'The server confirmed the debit, item and new balance.',
    proofBoundary: 'Requires an account-matching purchase receipt.',
    facts: [
      { label: 'Inventory', value: 'Server confirmed' },
      { label: 'Wallet balance', value: 'Server confirmed' },
    ],
    primaryAction: { id: 'view-inventory', label: 'View inventory' },
    secondaryAction: { id: 'not-now', label: 'Not now', emphasis: 'quiet' },
  },
  {
    id: 'SHP-09',
    paperNodeId: '9Q9-0',
    route: 'shop-detail',
    kind: 'receipt',
    tone: 'danger',
    eyebrow: 'NO MOMENTA SPENT',
    title: 'Purchase not completed.',
    detail:
      'A definitive server failure leaves balance and ownership unchanged.',
    proofBoundary: 'An unknown transport result must reconcile before retry.',
    facts: [
      { label: 'Wallet balance', value: 'Unchanged' },
      { label: 'Owned item', value: 'Not added' },
    ],
    primaryAction: { id: 'retry-purchase', label: 'Try again' },
    secondaryAction: {
      id: 'back-shop',
      label: 'Back to shop',
      emphasis: 'quiet',
    },
  },
  {
    id: 'SHP-10',
    paperNodeId: '9QA-0',
    route: 'shop-detail',
    kind: 'product',
    tone: 'success',
    eyebrow: 'OWNED',
    title: 'Streak Freeze.',
    detail: 'Ownership is read from the current account inventory.',
    proofBoundary: 'No local selection can fabricate an owned item.',
    facts: [
      { label: 'Available quantity', value: 'Server confirmed' },
      { label: 'Auto-apply rule', value: 'Next eligible miss' },
    ],
    primaryAction: { id: 'back-inventory', label: 'Back to inventory' },
    secondaryAction: {
      id: 'view-rule',
      label: 'View auto-apply rules',
      emphasis: 'secondary',
    },
  },
  {
    id: 'INV-01',
    paperNodeId: '71L-0',
    route: 'inventory',
    kind: 'inventory',
    tone: 'neutral',
    eyebrow: 'MOMENTA / INVENTORY',
    title: 'What you own, ready.',
    detail: 'Supported boosts and styles stay tied to this account.',
    proofBoundary: 'Rows appear only after account-scoped ownership sync.',
    facts: [
      { label: 'Streak Freeze', value: 'Ready' },
      { label: 'Time Extension', value: 'Select promise' },
      { label: 'Supported style', value: 'Owned' },
    ],
    primaryAction: { id: 'browse-shop', label: 'Browse shop' },
  },
  {
    id: 'INV-02',
    paperNodeId: '7HN-0',
    route: 'inventory',
    kind: 'inventory',
    tone: 'neutral',
    eyebrow: 'INVENTORY EMPTY',
    title: 'No items ready yet.',
    detail: 'Promises, proof and review remain available without an item.',
    proofBoundary: 'Empty requires a successful zero-item ownership read.',
    facts: [{ label: 'Owned kit', value: 'Confirmed empty' }],
    primaryAction: { id: 'open-shop', label: 'Open shop' },
    secondaryAction: {
      id: 'return-wallet',
      label: 'Return to wallet',
      emphasis: 'quiet',
    },
  },
  {
    id: 'INV-03',
    paperNodeId: '9QB-0',
    route: 'inventory',
    kind: 'receipt',
    tone: 'neutral',
    eyebrow: 'AUTO-APPLY RULE',
    title: 'No promise to choose.',
    detail: 'Streak Freeze protects the next eligible one-day miss.',
    proofBoundary: 'Proof history never changes and no target is selected.',
    facts: [{ label: 'Current truth', value: 'Ready in inventory' }],
    primaryAction: { id: 'acknowledge-rule', label: 'Got it' },
    secondaryAction: { id: 'back', label: 'Back', emphasis: 'quiet' },
  },
  {
    id: 'INV-04',
    paperNodeId: '9QC-0',
    route: 'inventory',
    kind: 'receipt',
    tone: 'success',
    eyebrow: 'INVENTORY · CONFIRMED',
    title: 'Protection is ready.',
    detail: 'The server confirmed the item in the current account inventory.',
    proofBoundary: 'Requires a current-account ownership receipt.',
    facts: [{ label: 'Current truth', value: 'Ready · auto-apply' }],
    primaryAction: { id: 'view-inventory', label: 'View inventory' },
    secondaryAction: { id: 'back', label: 'Back', emphasis: 'quiet' },
  },
  {
    id: 'INV-05',
    paperNodeId: '9QD-0',
    route: 'inventory',
    kind: 'receipt',
    tone: 'danger',
    eyebrow: 'OWNERSHIP UNKNOWN',
    title: 'Your kit is unavailable.',
    detail: 'No equipped item was removed or changed.',
    proofBoundary: 'A failed or stale-account read is never shown as empty.',
    facts: [{ label: 'Current truth', value: 'Ownership not confirmed' }],
    primaryAction: { id: 'retry-inventory', label: 'Try again' },
    secondaryAction: { id: 'back', label: 'Back', emphasis: 'quiet' },
  },
  {
    id: 'ADV-01',
    paperNodeId: '9QE-0',
    route: 'momenta',
    kind: 'reward',
    tone: 'action',
    eyebrow: 'OPTIONAL REWARD',
    title: 'Earn Momenta.',
    detail: 'Start only when a rewarded placement is actually available.',
    proofBoundary: 'Starting a sponsor message does not credit the wallet.',
    facts: [{ label: 'Wallet credit', value: 'Not started' }],
    primaryAction: { id: 'start-reward', label: 'Start reward' },
    secondaryAction: { id: 'back', label: 'Back', emphasis: 'quiet' },
  },
  {
    id: 'ADV-02',
    paperNodeId: '9QF-0',
    route: 'momenta',
    kind: 'reward',
    tone: 'warning',
    eyebrow: 'CREDIT PENDING',
    title: 'Checking the reward.',
    detail: 'Menta is waiting for the signed credit receipt.',
    proofBoundary: 'Sponsor completion is not a wallet-credit receipt.',
    facts: [
      { label: 'Sponsor handoff', value: 'Finished' },
      { label: 'Wallet balance', value: 'Unchanged' },
    ],
    primaryAction: {
      id: 'reward-pending',
      label: 'Credit pending',
      disabled: true,
    },
    secondaryAction: { id: 'back', label: 'Back', emphasis: 'quiet' },
  },
  {
    id: 'ADV-03',
    paperNodeId: '9QG-0',
    route: 'momenta',
    kind: 'reward',
    tone: 'success',
    eyebrow: 'REWARD CONFIRMED',
    title: 'Momenta credited.',
    detail: 'The server confirmed the reward and current wallet balance.',
    proofBoundary: 'Requires a signed account-matching credit receipt.',
    facts: [
      { label: 'Reward receipt', value: 'Server confirmed' },
      { label: 'Wallet balance', value: 'Account confirmed' },
    ],
    primaryAction: {
      id: 'return-blocked-action',
      label: 'Return to blocked action',
    },
    secondaryAction: { id: 'back', label: 'Back', emphasis: 'quiet' },
  },
] as const satisfies readonly CommercePaperState[];

export type CommercePaperStateId =
  (typeof COMMERCE_FAMILY_PAPER_STATES)[number]['id'];

export const getCommercePaperState = (
  id: CommercePaperStateId
): CommercePaperState => {
  const state = COMMERCE_FAMILY_PAPER_STATES.find(
    candidate => candidate.id === id
  );

  if (!state) {
    throw new Error(`Unknown Commerce Paper state: ${id}`);
  }

  return state as CommercePaperState;
};
