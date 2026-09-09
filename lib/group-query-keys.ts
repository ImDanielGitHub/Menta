export const groupQueryKeys = {
  all: ['groups'] as const,
  account: (userId: string) => ['groups', 'account', userId] as const,
  detail: (userId: string, id: string) =>
    ['groups', 'account', userId, 'detail', id] as const,
  members: (userId: string, id: string) =>
    ['groups', 'account', userId, 'detail', id, 'members'] as const,
  challenges: (userId: string, id: string) =>
    ['groups', 'account', userId, 'detail', id, 'challenges'] as const,
  reviewStats: (userId: string, id: string) =>
    ['groups', 'account', userId, 'detail', id, 'reviewStats'] as const,
};
