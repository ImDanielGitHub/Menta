import { decodeMentaMediaPermission } from '../decode';
import { getMentaCheckMediaPermissionV2 } from '../api';
const receipt = {
  success: true,
  consented: true,
  policy_version: 2,
  acknowledgement_id: '30000000-0000-4000-8000-000000000001',
  acknowledged_at: '2026-10-04T05:00:00.000Z',
};
const withdrawn = {
  success: true,
  consented: false,
  policy_version: null,
  acknowledgement_id: null,
  acknowledged_at: null,
};
const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));
beforeEach(() => mockRpc.mockReset());
it('confirms only a complete independent active v2 readback receipt', () => {
  expect(decodeMentaMediaPermission(receipt)).toBe('allowed');
  expect(decodeMentaMediaPermission(withdrawn)).toBe('needs-review');
});
it.each([
  null,
  undefined,
  {},
  { success: false, code: 'NOT_AUTHENTICATED' },
  { success: true, consented: true, policy_version: 2 },
  { ...receipt, policy_version: 1 },
  { ...receipt, acknowledgement_id: '' },
  { ...receipt, acknowledgement_id: 'invented' },
  { ...receipt, acknowledged_at: 'invalid' },
  { ...receipt, consented: false },
  { success: true, consented: false },
])('fails closed for absent, legacy or malformed readback %p', data => {
  expect(decodeMentaMediaPermission(data)).toBe('unavailable');
});
it.each([
  [receipt, 'allowed'],
  [withdrawn, 'needs-review'],
])(
  'uses only the deployed authenticated v2 getter for %p',
  async (data, state) => {
    mockRpc.mockResolvedValue({ data, error: null });
    await expect(getMentaCheckMediaPermissionV2()).resolves.toBe(state);
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('get_menta_check_media_consent_v2');
  }
);
it('does not fall back to overview or v1 when readback is unavailable', async () => {
  mockRpc.mockResolvedValue({ data: null, error: null });
  await expect(getMentaCheckMediaPermissionV2()).rejects.toThrow(
    'CONSENT_NOT_CONFIRMED'
  );
  expect(mockRpc).toHaveBeenCalledTimes(1);
});
it('propagates transport errors without inventing acceptance', async () => {
  const error = new Error('offline');
  mockRpc.mockResolvedValue({ data: null, error });
  await expect(getMentaCheckMediaPermissionV2()).rejects.toBe(error);
});
