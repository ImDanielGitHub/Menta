import {
  describeGroupMembershipActivity,
  resolveGroupActivityGroupName,
  resolveGroupActivityMemberName,
} from '../group-activity-copy';

describe('group membership activity copy', () => {
  it('names a join without calling it an update or a post', () => {
    expect(
      describeGroupMembershipActivity({
        memberName: 'Maya',
        groupName: 'Morning Miles',
        kind: 'joined',
      })
    ).toEqual({
      memberName: 'Maya',
      groupName: 'Morning Miles',
      activity: 'joined the group',
      body: 'Maya joined Morning Miles',
    });
  });

  it('names a leave the same way', () => {
    expect(
      describeGroupMembershipActivity({
        memberName: 'Maya',
        groupName: 'Morning Miles',
        kind: 'left',
      }).body
    ).toBe('Maya left Morning Miles');
  });

  it('does not invent A member or your group when names are missing', () => {
    expect(resolveGroupActivityMemberName(null)).toBe('Member');
    expect(resolveGroupActivityMemberName('  ')).toBe('Member');
    expect(resolveGroupActivityGroupName(undefined)).toBe('Group');
    expect(
      describeGroupMembershipActivity({
        memberName: '',
        groupName: null,
        kind: 'joined',
      }).body
    ).toBe('Member joined Group');
  });
});
