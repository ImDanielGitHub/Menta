import { useTranslation } from '@/lib/localization';
import React from 'react';

import { AppInlineNotice } from '@/components/ui/AppFeedback';

/** Production offline truth shared by Support and the deterministic gallery. */
export const OfflineSupportNotice = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <AppInlineNotice
      actionLabel={t('fullAuth.shared.check_connection_again')}
      description={t(
        'fullAuth.component_support_offlinesupportnotice.you_can_still_read_the_last_saved_screen_proof_a'
      )}
      onAction={onRetry}
      testID="support-offline-notice"
      title={t(
        'fullAuth.component_support_offlinesupportnotice.you_re_offline'
      )}
      tone="warning"
    />
  );
};
