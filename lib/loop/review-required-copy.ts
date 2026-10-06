import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';
import { translate, type TranslationKey } from '@/lib/localization';
import { correctionProofKind } from '@/lib/proof/correction-copy';

type Translate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: Translate = (key, values) =>
  translate('en-NZ', key, values);

const reviewDetailKey = (
  proofType?: string | null
):
  | 'today.state.review.detail_note'
  | 'today.state.review.detail_photo'
  | 'today.state.review.detail_video'
  | 'today.state.review.detail' => {
  const kind = correctionProofKind(proofType);
  if (kind === 'note') return 'today.state.review.detail_note';
  if (kind === 'photo') return 'today.state.review.detail_photo';
  if (kind === 'video') return 'today.state.review.detail_video';
  return 'today.state.review.detail';
};

/** Review-due copy names the agreed medium. Unknown types never invent a photo. */
export const getReviewRequiredDetail = ({
  proofType,
  reward = ECONOMY_CONTRACT_V1.review.reward,
  dailyLimit = ECONOMY_CONTRACT_V1.review.dailyLimit,
  t = defaultTranslate,
}: {
  proofType?: string | null;
  reward?: number;
  dailyLimit?: number;
  t?: Translate;
} = {}): string =>
  t(reviewDetailKey(proofType), {
    reward,
    dailyLimit,
  });
