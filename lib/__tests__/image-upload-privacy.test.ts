import { ImageService } from '@/lib/image-service';
import { decode } from 'base64-arraybuffer';
jest.mock('@/lib/supabase', () => ({
  supabase: {},
  STORAGE_BUCKETS: { CHALLENGE_VERIFICATIONS: 'challenge-verifications' },
  SUPABASE_URL: 'https://example.supabase.co',
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: 'owner' }, isAuthenticated: true }),
  },
}));
jest.mock('base64-arraybuffer', () => ({ decode: jest.fn() }));
it('does not copy rejected proof bytes into console diagnostics', async () => {
  const logger = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  const proof = 'U0VOU0lUSVZFUFJPT0Y='.repeat(12);
  jest.mocked(decode).mockImplementation(() => {
    throw new Error('decode failed');
  });
  await expect(
    ImageService.upload(
      'CHALLENGE_VERIFICATIONS',
      'owner/proof.jpg',
      proof,
      'image/jpeg'
    )
  ).rejects.toThrow('Invalid base64 data format');
  expect(JSON.stringify(logger.mock.calls)).not.toContain(proof.slice(0, 100));
  logger.mockRestore();
});
