import { acceptMentaCheckMediaConsentV2, setMentaCheckConsent } from '../api';

const acknowledgement = {
  acknowledgement_id: '30000000-0000-4000-8000-000000000001',
  acknowledged_at: '2026-10-04T05:00:00.000Z',
};
const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

beforeEach(() => mockRpc.mockReset());

it.each([true, false])(
  'preserves the existing v1 call for accept=%s',
  async accept => {
    mockRpc.mockResolvedValue({
      data: { success: true, consented: accept },
      error: null,
    });
    await expect(setMentaCheckConsent(accept, 'settings')).resolves.toEqual({
      success: true,
      consented: accept,
    });
    expect(mockRpc).toHaveBeenCalledWith('set_menta_check_consent_v1', {
      p_accept: accept,
      p_source: 'settings',
    });
  }
);

it('accepts only an explicit confirmed v2 response', async () => {
  mockRpc.mockResolvedValue({
    data: {
      success: true,
      consented: true,
      policy_version: 2,
      ...acknowledgement,
    },
    error: null,
  });
  await expect(acceptMentaCheckMediaConsentV2('intro')).resolves.toEqual({
    success: true,
    consented: true,
    policy_version: 2,
    ...acknowledgement,
  });
  expect(mockRpc).toHaveBeenCalledWith('set_menta_check_consent_v2', {
    p_accept: true,
    p_source: 'intro',
    p_policy_version: 2,
  });
});

it.each([
  { success: true, consented: true, policy_version: 2 },
  {
    success: true,
    consented: true,
    policy_version: 2,
    ...acknowledgement,
    acknowledgement_id: '',
  },
  {
    success: true,
    consented: true,
    policy_version: 2,
    ...acknowledgement,
    acknowledged_at: 'invalid-date',
  },
  { success: true, consented: false, policy_version: 2 },
  { success: true, consented: true },
  { success: true, consented: true, policy_version: 1 },
  { success: 'true', consented: true, policy_version: 2 },
])(
  'does not invent consent from an incomplete success response: %p',
  async data => {
    mockRpc.mockResolvedValue({ data, error: null });
    await expect(acceptMentaCheckMediaConsentV2('settings')).resolves.toEqual({
      success: false,
      code: 'CONSENT_NOT_CONFIRMED',
    });
  }
);

it('preserves a rejected receipt', async () => {
  mockRpc.mockResolvedValue({
    data: { success: false, code: 'NOT_AUTHENTICATED' },
    error: null,
  });
  await expect(acceptMentaCheckMediaConsentV2('settings')).resolves.toEqual({
    success: false,
    code: 'NOT_AUTHENTICATED',
  });
});

it('rejects an unknown response', async () => {
  mockRpc.mockResolvedValue({ data: null, error: null });
  await expect(acceptMentaCheckMediaConsentV2('settings')).resolves.toEqual({
    success: false,
    code: 'UNKNOWN_RESPONSE',
  });
});

it('propagates transport errors', async () => {
  const error = new Error('SYNTHETIC_TRANSPORT_ERROR');
  mockRpc.mockResolvedValue({ data: null, error });
  await expect(acceptMentaCheckMediaConsentV2('settings')).rejects.toBe(error);
});
