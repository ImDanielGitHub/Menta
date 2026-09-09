import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

interface RevenueCatEvent {
  id?: string;
  type?: string;
  app_user_id?: string;
  event_timestamp_ms?: number;
  app_id?: string;
  product_id?: string;
  entitlement_ids?: string[];
  cancel_reason?: string | null;
  expiration_reason?: string | null;
  original_transaction_id?: string;
  store?: string;
  transaction_id?: string;
  purchased_at_ms?: number;
  purchase_date_ms?: number;
  expiration_at_ms?: number | null;
  expiration_date_ms?: number | null;
  price_in_purchased_currency?: number;
  price?: number;
  currency?: string;
  source?: string;
  virtual_currency_transaction_id?: string;
  ad_transaction_id?: string;
  adjustments?: Array<{
    amount?: number;
    currency?: {
      code?: string;
      name?: string;
      description?: string;
    };
  }>;
}

const jsonHeaders = { 'Content-Type': 'application/json' };
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const purchaseTypes =
  /(INITIAL_PURCHASE|NON_RENEWING_PURCHASE|PURCHASE|RENEWAL)/i;
const entitlementActivationTypes =
  /(INITIAL_PURCHASE|NON_RENEWING_PURCHASE|RENEWAL|UNCANCELLATION|SUBSCRIPTION_EXTENDED|TEMPORARY_ENTITLEMENT_GRANT|REFUND_REVERSED)/i;
const entitlementDeactivationTypes = /(EXPIRATION)/i;
const proEntitlementKeys = ['pro_access', 'Pro', 'pro'];
const adRewardIgnoredReasons = new Set([
  'amount_mismatch',
  'cooldown',
  'currency_mismatch',
  'daily_limit',
]);

type WebhookFailureCode =
  | 'backend_rejected'
  | 'backend_unavailable'
  | 'pro_freeze_reconciliation_pending';

class WebhookProcessingError extends Error {
  constructor(
    readonly code: WebhookFailureCode,
    readonly retryable: boolean
  ) {
    super(code);
    this.name = 'WebhookProcessingError';
  }
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function normalizeBearer(value: string | null): string {
  return (value || '').replace(/^Bearer\s+/i, '').trim();
}

function normalizeStore(value: string | undefined): string {
  return (value || 'app_store').toLowerCase();
}

async function assertOk(response: Response): Promise<void> {
  if (!response.ok) {
    throw new WebhookProcessingError(
      response.status === 429 || response.status >= 500
        ? 'backend_unavailable'
        : 'backend_rejected',
      response.status === 429 || response.status >= 500
    );
  }
}

async function restJson<T>(
  supabaseUrl: string,
  serviceRoleKey: string,
  path: string,
  init: RequestInit
): Promise<T | null> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  await assertOk(response);

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}

async function grantProPeriodFreeze(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  periodReference: string,
  quantity: number
): Promise<void> {
  const result = await restJson<{
    success?: boolean;
    granted?: boolean;
    error?: string;
  }>(supabaseUrl, serviceRoleKey, '/rest/v1/rpc/grant_pro_period_freeze_v2', {
    method: 'POST',
    body: JSON.stringify({
      p_user_id: userId,
      p_period_reference: periodReference,
      p_quantity: quantity,
    }),
  });

  if (!result?.success) {
    throw new WebhookProcessingError('pro_freeze_reconciliation_pending', true);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  console.log('[RC Webhook] Request received at', new Date().toISOString());

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (req.method === 'GET') {
    const configured = Boolean(
      Deno.env.get('REVENUECAT_WEBHOOK_AUTH') ||
      Deno.env.get('REVENUECAT_WEBHOOK_SECRET')
    );
    return json({
      status: configured ? 'ok' : 'misconfigured',
      version: '13',
      webhookSecretConfigured: configured,
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const expectedAuth =
      Deno.env.get('REVENUECAT_WEBHOOK_AUTH') ||
      Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

    if (expectedAuth) {
      const provided = req.headers.get('authorization') || '';
      if (
        provided !== expectedAuth &&
        normalizeBearer(provided) !== expectedAuth
      ) {
        console.warn(
          '[RC Webhook] Rejected request with invalid shared secret'
        );
        return json({ ok: false, retry: false, code: 'unauthorized' }, 401);
      }
    } else {
      console.error('[RC Webhook] Missing REVENUECAT_WEBHOOK_AUTH');
      return json(
        {
          ok: false,
          retry: false,
          code: 'webhook_secret_not_configured',
        },
        500
      );
    }

    const payload = await req.json();
    const event: RevenueCatEvent = payload?.event || payload;

    console.log('[RC Webhook] Event received', {
      type: event.type || 'UNKNOWN',
      source: event.source === 'ad_reward' ? 'ad_reward' : 'commerce',
      entitlementCount: Array.isArray(event.entitlement_ids)
        ? event.entitlement_ids.length
        : 0,
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[RC Webhook] Missing env vars');
      return json(
        { ok: false, retry: false, code: 'server_misconfigured' },
        500
      );
    }

    const rawUserId = event.app_user_id;
    const userId = rawUserId && uuidPattern.test(rawUserId) ? rawUserId : null;
    if (!userId) {
      console.log('[RC Webhook] Missing or invalid app_user_id, skipping');
      return json({ ok: true, skipped: true, reason: 'invalid_user_id' });
    }

    const isRevenueCatAdReward =
      event.type === 'VIRTUAL_CURRENCY_TRANSACTION' &&
      event.source === 'ad_reward';

    if (isRevenueCatAdReward) {
      const expectedCurrencyCode =
        Deno.env.get('REVENUECAT_MOMENTA_CURRENCY_CODE') || 'MNT';
      const adjustment = Array.isArray(event.adjustments)
        ? event.adjustments.find(
            candidate =>
              candidate?.currency?.code === expectedCurrencyCode &&
              Number.isSafeInteger(candidate.amount) &&
              Number(candidate.amount) > 0
          )
        : undefined;
      const providerEventId = event.id?.trim() || '';
      const virtualCurrencyTransactionId =
        event.virtual_currency_transaction_id?.trim() || '';
      const clientTransactionId = event.ad_transaction_id?.trim() || '';

      if (
        !providerEventId ||
        !virtualCurrencyTransactionId ||
        !clientTransactionId ||
        !adjustment ||
        !adjustment.currency?.code
      ) {
        console.warn('[RC Webhook] Incomplete verified ad reward event');
        return json(
          { ok: false, retry: true, code: 'incomplete_ad_reward_event' },
          503
        );
      }

      const eventAt = Number.isFinite(event.event_timestamp_ms)
        ? new Date(event.event_timestamp_ms as number).toISOString()
        : null;
      const application = await restJson<{
        success?: boolean;
        duplicate?: boolean;
        status?: 'applied' | 'ignored' | 'retry';
        reason?: string | null;
      }>(
        supabaseUrl,
        serviceRoleKey,
        '/rest/v1/rpc/apply_revenuecat_ad_reward_v1',
        {
          method: 'POST',
          body: JSON.stringify({
            p_provider_event_id: providerEventId,
            p_event_at: eventAt,
            p_user_id: userId,
            p_virtual_currency_transaction_id: virtualCurrencyTransactionId,
            p_client_transaction_id: clientTransactionId,
            p_currency_code: adjustment.currency.code,
            p_amount: adjustment.amount,
            p_payload: payload,
          }),
        }
      );

      if (application?.status === 'retry' || application?.success === false) {
        return json(
          {
            ok: false,
            retry: true,
            code: 'ad_reward_reconciliation_pending',
          },
          503
        );
      }

      const ignoredReason =
        application?.status === 'ignored' &&
        application.reason &&
        adRewardIgnoredReasons.has(application.reason)
          ? application.reason
          : null;

      return json({
        ok: true,
        duplicate: Boolean(application?.duplicate),
        status: application?.status || 'ignored',
        reason: ignoredReason,
      });
    }

    const store = normalizeStore(event.store);
    const productId = event.product_id || 'unknown_product';
    const transactionId =
      event.transaction_id ||
      event.original_transaction_id ||
      `${productId}:${event.type || 'UNKNOWN'}:${event.event_timestamp_ms || 'missing-time'}`;
    const providerEventId =
      event.id?.trim() ||
      `${store}:${transactionId}:${event.type || 'UNKNOWN'}:${event.event_timestamp_ms || 'missing-time'}`;
    const eventAt = Number.isFinite(event.event_timestamp_ms)
      ? new Date(event.event_timestamp_ms as number).toISOString()
      : null;
    const purchasedAtMs = event.purchased_at_ms ?? event.purchase_date_ms;
    const expirationAtMs = event.expiration_at_ms ?? event.expiration_date_ms;
    const purchaseAt = Number.isFinite(purchasedAtMs)
      ? new Date(purchasedAtMs as number).toISOString()
      : eventAt || new Date().toISOString();
    const expiresAt = Number.isFinite(expirationAtMs)
      ? new Date(expirationAtMs as number).toISOString()
      : null;
    const entitlementIds = Array.isArray(event.entitlement_ids)
      ? event.entitlement_ids
      : [];
    const hasPro = entitlementIds.some(key => proEntitlementKeys.includes(key));
    const isEntitlementActivation = entitlementActivationTypes.test(
      event.type || ''
    );
    const isEntitlementDeactivation = entitlementDeactivationTypes.test(
      event.type || ''
    );
    const isPurchase = purchaseTypes.test(event.type || '');
    const weeklyPro = /weekly/i.test(productId);
    const freezeQuantity = weeklyPro
      ? 0
      : /annual|yearly/i.test(productId)
        ? 12
        : 1;
    const paidPrice = Number.isFinite(event.price_in_purchased_currency)
      ? event.price_in_purchased_currency
      : Number.isFinite(event.price)
        ? event.price
        : null;
    // Entitlement processing remains independent of the confirmed cash receipt.
    // A missing amount or zero-price trial must not mint the paid weekly grant.
    const weeklyPaymentConfirmed =
      typeof paidPrice === 'number' && paidPrice > 0;

    let mappedCredits: number | undefined;
    if (isPurchase) {
      const mappings = await restJson<Array<{ credits: number }>>(
        supabaseUrl,
        serviceRoleKey,
        `/rest/v1/rc_credit_mappings?product_id=eq.${encodeURIComponent(productId)}&select=credits&limit=1`,
        { method: 'GET' }
      );
      mappedCredits = mappings?.[0]?.credits;
    }

    let creditAmount: number | null = null;
    let creditReason: string | null = null;
    let creditReference: string | null = null;
    let creditDescription: string | null = null;

    if (isPurchase && typeof mappedCredits === 'number' && mappedCredits > 0) {
      creditAmount = mappedCredits;
      creditReason = 'credit_pack_purchase';
      creditReference = `rc:${store}:${transactionId}:credit_pack`;
      creditDescription = 'Momenta pack';
    } else if (isPurchase && hasPro && (!weeklyPro || weeklyPaymentConfirmed)) {
      creditAmount = /annual|yearly/i.test(productId)
        ? 4000
        : /weekly/i.test(productId)
          ? 75
          : 300;
      creditReason = 'subscription_credit';
      creditReference = `rc:${store}:${transactionId}:subscription_credit`;
      creditDescription = /annual|yearly/i.test(productId)
        ? 'Menta Pro, yearly'
        : /weekly/i.test(productId)
          ? 'Menta Pro, weekly'
          : 'Menta Pro, monthly';
    }

    const entitlementState =
      isEntitlementActivation && entitlementIds.length > 0
        ? true
        : isEntitlementDeactivation
          ? false
          : null;

    const application = await restJson<{
      duplicate?: boolean;
      entitlement_applied?: boolean;
      status?: string;
      ignored_reason?: string | null;
    }>(
      supabaseUrl,
      serviceRoleKey,
      '/rest/v1/rpc/apply_revenuecat_webhook_event',
      {
        method: 'POST',
        body: JSON.stringify({
          p_provider_event_id: providerEventId,
          p_event_type: event.type || 'UNKNOWN',
          p_event_at: eventAt,
          p_user_id: userId,
          p_store: store,
          p_product_id: productId,
          p_transaction_id: transactionId,
          p_original_transaction_id: event.original_transaction_id || null,
          p_purchase_at: purchaseAt,
          p_expires_at: expiresAt,
          p_amount_cents:
            typeof event.price_in_purchased_currency === 'number'
              ? Math.round(event.price_in_purchased_currency * 100)
              : null,
          p_currency: event.currency || null,
          p_entitlement_keys: entitlementIds,
          p_entitlement_state: entitlementState,
          p_credit_amount: creditAmount,
          p_credit_reason: creditReason,
          p_credit_transaction_type: creditAmount ? 'credit' : null,
          p_credit_external_reference_id: creditReference,
          p_credit_description: creditDescription,
          p_payload:
            weeklyPro && isPurchase && hasPro
              ? {
                  ...payload,
                  menta_credit_decision: weeklyPaymentConfirmed
                    ? 'weekly_payment_confirmed'
                    : paidPrice === null
                      ? 'weekly_payment_amount_missing'
                      : 'weekly_no_paid_amount',
                }
              : payload,
        }),
      }
    );

    if (application?.duplicate) {
      console.log('[RC Webhook] Duplicate event ignored');
      if (
        creditReason === 'subscription_credit' &&
        creditReference &&
        freezeQuantity > 0
      ) {
        await grantProPeriodFreeze(
          supabaseUrl,
          serviceRoleKey,
          userId,
          creditReference,
          freezeQuantity
        );
      }
      return json({ ok: true, duplicate: true });
    }

    if (application?.status === 'retry') {
      console.warn('[RC Webhook] Event requires reconciliation');
      return json(
        {
          ok: false,
          retry: true,
          code: 'reconciliation_pending',
        },
        503
      );
    }

    if (application?.status === 'ignored') {
      console.log('[RC Webhook] Event receipted without mutation');
      return json({
        ok: true,
        skipped: true,
        reason: 'ignored',
      });
    }

    if (
      creditReason === 'subscription_credit' &&
      creditReference &&
      freezeQuantity > 0
    ) {
      await grantProPeriodFreeze(
        supabaseUrl,
        serviceRoleKey,
        userId,
        creditReference,
        freezeQuantity
      );
    }

    console.log('[RC Webhook] Event applied');
    return json({
      ok: true,
      entitlement_applied: Boolean(application?.entitlement_applied),
    });
  } catch (error) {
    const knownError =
      error instanceof WebhookProcessingError ? error : undefined;
    const code = knownError?.code || 'webhook_processing_failed';
    const retry = knownError?.retryable ?? false;
    console.error('[RC Webhook] Processing failed', { code, retry });
    return json({ ok: false, retry, code }, retry ? 503 : 500);
  }
});
