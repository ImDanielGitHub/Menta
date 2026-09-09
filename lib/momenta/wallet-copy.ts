import type { TranslationKey } from '@/lib/localization/en-NZ';

type Translate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: Translate = key => {
  const copy: Record<string, string> = {
    'commerce.wallet.balanceNote':
      'Your first promise and group are free. Use Momenta for extra promises, groups, freezes and shop items. It has no cash value.',
    'commerce.wallet.activityTitle': 'Recent activity',
    'commerce.wallet.activityEmpty':
      'Confirmed rewards, purchases and spending will appear here.',
    'commerce.wallet.add': 'Add Momenta',
    'commerce.wallet.addDetail':
      'Menta can add it after confirmed reviews or streak milestones. You can also choose an optional sponsor or buy a pack.',
  };
  return copy[String(key)] ?? String(key);
};

/** Plain-language wallet copy. Momenta is not cash, crypto, or a stake. */
export const getWalletBalanceNote = (t: Translate = defaultTranslate): string =>
  t('commerce.wallet.balanceNote');

export const getWalletEmptyActivityCopy = (
  t: Translate = defaultTranslate
) => ({
  title: t('commerce.wallet.activityTitle'),
  detail: t('commerce.wallet.activityEmpty'),
});

export const getWalletEarnSheetCopy = (t: Translate = defaultTranslate) => ({
  title: t('commerce.wallet.add'),
  subtitle: t('commerce.wallet.addDetail'),
});
