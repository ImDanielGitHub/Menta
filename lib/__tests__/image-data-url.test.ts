import { ImageService } from '../image-service';
const mockUpload = jest.fn().mockResolvedValue({ data: {}, error: null });
jest.mock('@/lib/supabase', () => ({
  SUPABASE_URL: 'https://example.invalid',
  STORAGE_BUCKETS: { verification: 'verification' },
  supabase: { storage: { from: () => ({ upload: mockUpload }) } },
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: 'synthetic-user' }, isAuthenticated: true }),
  },
}));
const payload = 'AQID'.repeat(400);
beforeEach(() => jest.clearAllMocks());
it.each([
  payload,
  `data:image/jpeg;base64,${payload}`,
  `DATA:image/jpeg;BASE64,${payload}`,
])('uploads exact native bytes for supported base64 form %#', async input => {
  await expect(
    ImageService.upload(
      'verification' as never,
      'synthetic/image.jpg',
      input,
      'image/jpeg'
    )
  ).resolves.toBe('synthetic/image.jpg');
  const bytes = new Uint8Array(mockUpload.mock.calls[0][1]);
  expect(bytes.length).toBe(1200);
  expect([...bytes.slice(0, 6)]).toEqual([1, 2, 3, 1, 2, 3]);
});
it.each([
  'data:image/jpeg,not-base64',
  `data:image/jpeg;base64,${payload}!`,
  'data:image/jpeg;base64,',
])('rejects malformed data URLs before storage mutation %#', async input => {
  await expect(
    ImageService.upload(
      'verification' as never,
      'synthetic/image.jpg',
      input,
      'image/jpeg'
    )
  ).rejects.toThrow();
  expect(mockUpload).not.toHaveBeenCalled();
});
