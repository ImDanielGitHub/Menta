import { groupQueryKeys } from '@/lib/group-query-keys';

describe('group query keys', () => {
  it('isolates persisted group data by authenticated account', () => {
    expect(groupQueryKeys.detail('user-a', 'group-1')).not.toEqual(
      groupQueryKeys.detail('user-b', 'group-1')
    );
    expect(groupQueryKeys.members('user-a', 'group-1')).toEqual([
      'groups',
      'account',
      'user-a',
      'detail',
      'group-1',
      'members',
    ]);
  });
});
