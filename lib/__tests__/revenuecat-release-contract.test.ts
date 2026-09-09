import fs from 'node:fs';
import path from 'node:path';

const readFile = (workspaceRelativePath: string): string => {
  const absolutePath = path.join(process.cwd(), workspaceRelativePath);
  return fs.readFileSync(absolutePath, 'utf-8');
};

describe('RevenueCat release contract', () => {
  it('rejects webhook traffic when the shared secret is missing', () => {
    const webhook = readFile('supabase/functions/revenuecat-webhook/index.ts');

    expect(webhook).toContain('webhook_secret_not_configured');
    expect(webhook).toContain('webhookSecretConfigured');
    expect(webhook).toContain("status: configured ? 'ok' : 'misconfigured'");
    expect(webhook).not.toContain('accepting signed provider traffic');
  });

  it('uses the live StoreKit credit price without a made-up runtime fallback', () => {
    const shop = readFile('app/shop/[id].tsx');
    const momenta = readFile('app/momenta.tsx');
    const storeKit = readFile('scripts/generate-storekit-config.js');
    const rcMigration = readFile(
      'supabase/migrations/20260430103000_app_store_revenuecat_release_fixes.sql'
    );

    expect(shop).toContain('match?.product?.priceString || null');
    expect(shop).toContain("t('commerce.wallet.checkingPrice')");
    expect(momenta).toContain('match?.product?.priceString || null');
    expect(momenta).toContain(
      "creditPrice || t('commerce.wallet.unavailable')"
    );
    expect(shop).not.toContain('$24.99');
    expect(momenta).not.toContain('$24.99');
    expect(storeKit).toContain('value: 24.99');
    expect(rcMigration).toContain(
      "('com.anekedigitalapps.lockedin.credits_large', 1200)"
    );
  });

  it('routes entitlement updates through monotonic server authority', () => {
    const webhook = readFile('supabase/functions/revenuecat-webhook/index.ts');
    const migration = readFile(
      'supabase/migrations/20260813143000_revenuecat_event_authority.sql'
    );

    expect(webhook).toContain('/rest/v1/rpc/apply_revenuecat_webhook_event');
    expect(webhook).toContain('p_provider_event_id: providerEventId');
    expect(webhook).toContain('p_event_at: eventAt');
    expect(webhook).toContain('p_user_id: userId');
    expect(webhook).not.toContain('/rest/v1/rc_entitlements?');
    expect(migration).toContain('on conflict (provider_event_id) do nothing');
    expect(migration).toContain(
      'excluded.last_provider_event_at > public.rc_entitlements.last_provider_event_at'
    );
    expect(migration).not.toContain('excluded.last_provider_event_id >');
    expect(migration).toContain("v_ignored_reason := 'stale_event_time'");
  });

  it('retries recoverable webhook receipts without duplicate credit', () => {
    const webhook = readFile('supabase/functions/revenuecat-webhook/index.ts');
    const migration = readFile(
      'supabase/migrations/20260813143000_revenuecat_event_authority.sql'
    );

    expect(webhook).toContain("reason: 'invalid_user_id'");
    expect(webhook).toContain("application?.status === 'retry'");
    expect(webhook).toContain('503');
    expect(migration).toContain("v_existing_status <> 'retry'");
    expect(migration).toContain("v_ignored_reason := 'profile_not_found'");
    expect(migration).toContain("when v_status = 'retry' then null");
    expect(migration).toContain(
      'public.rc_receipts.user_id,\n    excluded.user_id'
    );

    const creditGrant = migration.indexOf('select public.grant_momenta_credit');
    const entitlementDecision = migration.indexOf(
      'if v_profile_exists and p_entitlement_state is not null'
    );
    expect(creditGrant).toBeGreaterThan(-1);
    expect(creditGrant).toBeLessThan(entitlementDecision);
  });

  it('fails closed for same-time provider conflicts', () => {
    const migration = readFile(
      'supabase/migrations/20260813143000_revenuecat_event_authority.sql'
    );

    const accountLock = migration.indexOf("'revenuecat-entitlement:'");
    const retryRowLock = migration.indexOf('for update;');
    expect(accountLock).toBeGreaterThan(-1);
    expect(accountLock).toBeLessThan(retryRowLock);
    expect(migration).toContain(
      "v_ignored_reason := 'ambiguous_equal_timestamp'"
    );
    expect(migration).toContain(
      'is_active is distinct from p_entitlement_state'
    );
    expect(migration).toContain('reconciliation_keys text[] not null default');
    expect(migration).toContain(
      'and e.reconciliation_keys && p_entitlement_keys'
    );
    expect(migration).toContain(
      'reconciliation_keys = pending_resolution.remaining_keys'
    );
    expect(migration).toContain(
      'create or replace function public.get_my_pro_authority()'
    );
    expect(migration).toContain('p.is_pro and not v_reconciliation_pending');
    expect(migration).toContain(
      "e.ignored_reason = 'ambiguous_equal_timestamp'"
    );
  });

  it('recognises every supported Pro entitlement key after purchase and restore', () => {
    const revenueCat = readFile('lib/paywall/revenuecat.ts');

    expect(revenueCat).toContain(
      "Boolean(active['pro_access'] || active['Pro'] || active['pro'])"
    );
  });

  it('grants one Pro freeze per subscription credit, including duplicate retries', () => {
    const webhook = readFile('supabase/functions/revenuecat-webhook/index.ts');
    const freezeGrant = readFile(
      'supabase/migrations/20260815013000_pro_period_freeze_grant.sql'
    );

    expect(webhook).toContain('/rest/v1/rpc/grant_pro_period_freeze_v1');
    expect(webhook).toContain("creditReason === 'subscription_credit'");
    expect(webhook).toContain('p_period_reference: periodReference');
    expect(webhook).toContain('grantProPeriodFreeze(');
    expect(freezeGrant).toContain(
      'revoke all on function public.grant_pro_period_freeze_v1(uuid, text)'
    );
    expect(freezeGrant).toContain(
      'grant execute on function public.grant_pro_period_freeze_v1(uuid, text)'
    );
    expect(freezeGrant).toContain('to service_role');
  });
});
