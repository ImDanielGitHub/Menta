import {
  loadActivityInbox,
  markActivityRead,
} from '@/lib/notifications/activity-inbox';

const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn(),
  update: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};
jest.mock('@/lib/supabase', () => ({ supabase: { from: () => mockQuery } }));

describe('activity inbox database boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('requests only recent successful receipts owned by the signed-in account', async () => {
    mockQuery.limit.mockResolvedValueOnce({ data: [], error: null });
    expect(await loadActivityInbox('account-a')).toEqual([]);
    expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'account-a');
    expect(mockQuery.not).toHaveBeenCalledWith('delivered_at', 'is', null);
    expect(mockQuery.is).toHaveBeenCalledWith('delivery_error', null);
    expect(mockQuery.limit).toHaveBeenCalledWith(50);
  });
  it('does not claim a successful read when RLS finds no owned row', async () => {
    mockQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(markActivityRead('account-a', 42)).rejects.toThrow(
      'Activity receipt was not saved.'
    );
    expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'account-a');
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 42);
    expect(mockQuery.update).toHaveBeenCalledWith({
      is_read: true,
      opened_at: expect.any(String),
    });
  });
  it('propagates database read and write failures without reporting success', async () => {
    const failure = new Error('not authorized');
    mockQuery.limit.mockResolvedValueOnce({ data: null, error: failure });
    mockQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: failure });
    await expect(loadActivityInbox('account-a')).rejects.toThrow(
      'not authorized'
    );
    await expect(markActivityRead('account-a', 42)).rejects.toThrow(
      'not authorized'
    );
  });
});
