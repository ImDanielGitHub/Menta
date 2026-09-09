import {
  AUTHORING_SAFETY_DISCLOSURE,
  GROUP_SAFETY_DISCLOSURE,
  PROFILE_SAFETY_DISCLOSURE,
  PROOF_SAFETY_DISCLOSURE,
} from '@/lib/content-safety';

describe('content safety copy', () => {
  it('defines SFW and states group access separately from safety review', () => {
    expect(GROUP_SAFETY_DISCLOSURE).toContain('safe for work (SFW)');
    expect(GROUP_SAFETY_DISCLOSURE).toContain(
      'Invite-only controls who can join.'
    );
    expect(GROUP_SAFETY_DISCLOSURE).toContain('reports content');
  });

  it('states who can see profile identity and when staff can review content', () => {
    expect(PROFILE_SAFETY_DISCLOSURE).toContain(
      'Other Menta members can see your profile name and photo.'
    );
    expect(AUTHORING_SAFETY_DISCLOSURE).toContain('If someone reports content');
    expect(PROOF_SAFETY_DISCLOSURE).toContain('If someone reports it');
  });
});
