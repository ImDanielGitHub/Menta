import { supabase } from '@/lib/supabase';

export type MyProfile = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  momenta_balance: number;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
  is_pro: boolean;
  is_approved: boolean;
};

export type MyProfilePatch = {
  username?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  has_completed_onboarding?: boolean;
};

export type MyProAuthority = {
  is_pro: boolean;
  reconciliation_pending: boolean;
};

const firstProfile = (data: unknown): MyProfile | null => {
  if (Array.isArray(data)) {
    return (data[0] as MyProfile | undefined) ?? null;
  }
  return (data as MyProfile | null) ?? null;
};

export const getMyProfile = async (): Promise<MyProfile | null> => {
  const { data, error } = await supabase.rpc('get_my_profile');
  if (error) throw error;
  return firstProfile(data);
};

export const getMyProAuthority = async (): Promise<MyProAuthority | null> => {
  const { data, error } = await supabase.rpc('get_my_pro_authority');
  if (error) throw error;
  if (Array.isArray(data)) {
    return (data[0] as MyProAuthority | undefined) ?? null;
  }
  return (data as MyProAuthority | null) ?? null;
};

export const updateMyProfile = async (
  patch: MyProfilePatch
): Promise<MyProfile> => {
  const { data, error } = await supabase.rpc('update_my_profile', {
    p_patch: patch,
  });
  if (error) throw error;

  const profile = firstProfile(data);
  if (!profile) {
    throw new Error('PROFILE_NOT_FOUND');
  }
  return profile;
};
