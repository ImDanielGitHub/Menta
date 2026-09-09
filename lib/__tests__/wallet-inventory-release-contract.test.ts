import fs from 'fs';
import path from 'path';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260430121500_wallet_inventory_release_contract.sql'
);
const reviewRewardMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260601093000_review_queue_reward_contract.sql'
);
const reviewRewardGrantFixMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260601103000_revoke_public_claim_momenta_reward.sql'
);
const shopPurchaseReceiptMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260805201500_fix_purchase_shop_item_inventory_receipt.sql'
);
const appJsonPath = path.join(process.cwd(), 'app.json');
const iosInfoPlistPath = path.join(process.cwd(), 'ios/LockedInPro/Info.plist');

type GoogleMobileAdsPluginConfig = {
  androidAppId: string;
  delayAppMeasurementInit: boolean;
  iosAppId: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readAppJsonRaw = (): string => fs.readFileSync(appJsonPath, 'utf8');

const readAppJson = (): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(readAppJsonRaw());

  if (!isRecord(parsed)) {
    throw new Error('app.json did not parse to an object');
  }

  return parsed;
};

const getGoogleMobileAdsPluginConfig = (
  appConfig: Record<string, unknown>
): GoogleMobileAdsPluginConfig => {
  const expoConfig = appConfig.expo;

  if (!isRecord(expoConfig) || !Array.isArray(expoConfig.plugins)) {
    throw new Error('app.json is missing expo.plugins');
  }

  const pluginEntry = expoConfig.plugins.find(
    (plugin): plugin is [string, unknown] =>
      Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads'
  );

  if (!pluginEntry || !isRecord(pluginEntry[1])) {
    throw new Error('react-native-google-mobile-ads plugin config is missing');
  }

  const { androidAppId, delayAppMeasurementInit, iosAppId } = pluginEntry[1];

  if (
    typeof androidAppId !== 'string' ||
    typeof delayAppMeasurementInit !== 'boolean' ||
    typeof iosAppId !== 'string'
  ) {
    throw new Error('react-native-google-mobile-ads plugin config is invalid');
  }

  return { androidAppId, delayAppMeasurementInit, iosAppId };
};

describe('wallet and inventory release contract', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const reviewRewardSql = fs.readFileSync(reviewRewardMigrationPath, 'utf8');
  const reviewRewardGrantFixSql = fs.readFileSync(
    reviewRewardGrantFixMigrationPath,
    'utf8'
  );
  const shopPurchaseReceiptSql = fs.readFileSync(
    shopPurchaseReceiptMigrationPath,
    'utf8'
  );

  it('prevents arbitrary positive client Momenta grants', () => {
    expect(sql).toContain('p_amount > 0');
    expect(sql).toContain("auth.role(), '') <> 'service_role'");
    expect(sql).toContain('SERVER_GRANT_REQUIRED');
    expect(sql).toContain('claim_momenta_reward');
    expect(sql).toContain('from public, anon');
    expect(sql).toContain("v_reward_type = 'ad_reward'");
    expect(sql).toContain("reason = 'Ad reward'");
    expect(sql).toContain("interval '1 day'");
  });

  it('keeps welcome bonus fixed and idempotent', () => {
    expect(sql).toContain('grant_welcome_bonus_once');
    expect(sql).toContain('v_amount integer := 100');
    expect(sql).toContain('welcome_bonus_granted');
    expect(sql).toContain('welcome_bonus_v1');
  });

  it('allows only server-confirmed proof review rewards', () => {
    expect(reviewRewardSql).toContain("v_reward_type = 'review_queue_reward'");
    expect(reviewRewardSql).toContain('v_amount := 8');
    expect(reviewRewardSql).toContain(
      'wallet_transactions_external_reference_id_key'
    );
    expect(reviewRewardSql).toContain('v_external_reference_id');
    expect(reviewRewardSql).toContain("'review_queue_reward:'");
    expect(reviewRewardSql).toContain('for update');
    expect(reviewRewardSql).toContain('p_reference_id is null');
    expect(reviewRewardSql).toContain('from public.challenge_submissions cs');
    expect(reviewRewardSql).toContain("cs.status in ('approved', 'rejected')");
    expect(reviewRewardSql).toContain('cs.reviewer_id = p_user_id');
    expect(reviewRewardSql).toContain('cs.reviewed_by = p_user_id');
    expect(reviewRewardSql).toContain("'reason', 'already_granted'");
    expect(reviewRewardSql).toContain(
      'external_reference_id = v_external_reference_id'
    );
    expect(reviewRewardSql).toContain('external_reference_id,');
    expect(reviewRewardSql).toContain(
      'Daily review rewards are already claimed.'
    );
  });

  it('revokes public execution from the review reward RPC', () => {
    expect(reviewRewardSql).toContain('from public, anon');
    expect(reviewRewardSql).toContain('to authenticated, service_role');
    expect(reviewRewardGrantFixSql).toContain('from public, anon');
    expect(reviewRewardGrantFixSql).toContain('to authenticated, service_role');
  });

  it('makes shop ownership server-authoritative', () => {
    expect(sql).toContain('equip_owned_item');
    expect(sql).toContain('ITEM_NOT_OWNED');
    expect(sql).toContain('drop policy if exists purchases_all');
    expect(sql).toContain('drop policy if exists inventory_items_all');
    expect(sql).toContain('drop policy if exists equipped_items_all');
    expect(sql).toContain('create policy purchases_select_own');
    expect(sql).toContain('create policy inventory_items_select_own');
    expect(sql).toContain('create policy equipped_items_select_own');
  });

  it('keeps shop debit, ledger, and inventory receipt atomic', () => {
    expect(shopPurchaseReceiptSql).toContain(
      'create or replace function public.purchase_shop_item'
    );
    expect(shopPurchaseReceiptSql).toContain("set search_path = ''");
    expect(shopPurchaseReceiptSql).toContain('v_item_sku');
    expect(shopPurchaseReceiptSql).toContain(
      'insert into public.inventory_items as inventory'
    );
    expect(shopPurchaseReceiptSql).toContain('on conflict (user_id, item_sku)');
    expect(shopPurchaseReceiptSql).toContain(
      'coalesce(p.momenta_balance, 0) >= v_item_cost'
    );
    expect(shopPurchaseReceiptSql).toContain(
      'insert into public.wallet_transactions'
    );
    expect(shopPurchaseReceiptSql).toContain('from public, anon');
    expect(shopPurchaseReceiptSql).toContain('to authenticated, service_role');
    expect(shopPurchaseReceiptSql).not.toContain(
      'values (p_user_id, item_sku, 1)'
    );
  });

  it('repairs ledger and equip constraints used by the app', () => {
    expect(sql).toContain('wallet_transactions_id_seq');
    expect(sql).toContain('alter column id set default');
    expect(sql).toContain('equipped_items_user_id_category_key');
  });

  it('keeps Google Mobile Ads in the SDK 56 plugin config only', () => {
    const appConfig = readAppJson();
    const pluginConfig = getGoogleMobileAdsPluginConfig(appConfig);

    expect(appConfig).not.toHaveProperty('react-native-google-mobile-ads');
    expect(pluginConfig.androidAppId).toMatch(/^ca-app-pub-[0-9]+~[0-9]+$/);
    expect(pluginConfig.iosAppId).toMatch(/^ca-app-pub-[0-9]+~[0-9]+$/);
    expect(pluginConfig.delayAppMeasurementInit).toBe(true);
    expect(fs.readFileSync(iosInfoPlistPath, 'utf8')).toMatch(
      /<key>GADDelayAppMeasurementInit<\/key>\s*<true\/>/
    );
  });

  it('keeps app.json parseable by Google Mobile Ads iOS script', () => {
    expect(readAppJsonRaw()).not.toContain("'");
  });
});
