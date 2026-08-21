import { supabase, isPlaceholder } from './supabase';
import { createCouple as createCoupleApi } from './api';
import type { Couple, Profile } from '@/types';

export interface CreateCoupleParams {
  coupleName?: string;
  anniversaryDate?: string;
  partnerName?: string;
  partnerBirthday?: string;
}

export interface ConnectedPartner {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  timezone?: string;
  joinedAt: string;
}

/**
 * Join a couple / shared world using a romantic invite code (e.g. LOVE-84920)
 */
export async function joinCoupleByInviteCode(inviteCode: string): Promise<Couple | null> {
  const cleanCode = inviteCode.trim().toUpperCase();
  if (!cleanCode) throw new Error('Please enter a valid sanctuary invite code.');

  if (isPlaceholder) {
    // Local demo simulation
    return {
      id: 'demo-couple',
      couple_name: "Our Shared Sanctuary",
      anniversary_date: '2023-02-14',
      partner_name: 'Partner',
      partner_birthday: '2001-08-25',
      invite_code: cleanCode,
      partner_1_id: 'demo-user-1',
      partner_2_id: 'demo-user-2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase.rpc('join_couple_by_invite_code', {
      invite_code_input: cleanCode,
    });

    if (error) {
      throw new Error(error.message || 'Could not join shared world with this code.');
    }

    return data as Couple;
  } catch (err: any) {
    console.error('[RelationshipService] joinCoupleByInviteCode error:', err);
    throw err;
  }
}

/**
 * Fetch connected partner profile information
 */
export async function fetchConnectedPartner(
  coupleId: string,
  currentUserId: string
): Promise<ConnectedPartner | null> {
  if (!coupleId) return null;

  if (isPlaceholder) {
    return {
      userId: 'partner-id',
      displayName: 'Partner',
      timezone: 'UTC',
      joinedAt: new Date().toISOString(),
    };
  }

  try {
    // 1. Find the other member in couple_members
    const { data: members, error: memberError } = await supabase
      .from('couple_members')
      .select('user_id, joined_at')
      .eq('couple_id', coupleId);

    if (memberError || !members) return null;

    const otherMember = members.find((m) => m.user_id !== currentUserId);
    if (!otherMember) return null;

    // 2. Fetch profile of the other member
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', otherMember.user_id)
      .maybeSingle();

    if (profileError || !profile) {
      return {
        userId: otherMember.user_id,
        displayName: 'Partner',
        joinedAt: otherMember.joined_at,
      };
    }

    const typedProfile = profile as Profile;
    return {
      userId: typedProfile.id,
      displayName: typedProfile.display_name || 'My Love',
      avatarUrl: typedProfile.avatar_url || undefined,
      joinedAt: otherMember.joined_at,
    };
  } catch (err) {
    console.error('[RelationshipService] fetchConnectedPartner error:', err);
    return null;
  }
}

/**
 * Creates or retrieves the couple record for the current user.
 */
export async function createCoupleRecord(params: CreateCoupleParams = {}): Promise<Couple> {
  const { coupleName, anniversaryDate, partnerName, partnerBirthday } = params;

  if (isPlaceholder) {
    return {
      id: 'demo-couple',
      couple_name: coupleName || 'Our Shared Sanctuary',
      anniversary_date: anniversaryDate || null,
      partner_name: partnerName || null,
      partner_birthday: partnerBirthday || null,
      partner_1_id: 'demo-user-1',
      partner_2_id: null,
      invite_code: 'LOVE-DEMO1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // 1. Try Supabase RPC create_couple_for_user (bypasses service-role restriction)
  try {
    const { data, error } = await supabase.rpc('create_couple_for_user', {
      couple_name_input: coupleName || null,
      anniversary_date_input: anniversaryDate || null,
      partner_name_input: partnerName || null,
      partner_birthday_input: partnerBirthday || null,
    });

    if (!error && data) {
      return data as Couple;
    }
  } catch (rpcErr) {
    console.warn('[RelationshipService] RPC create_couple_for_user notice:', rpcErr);
  }

  // 2. Fallback to backend API endpoint if running
  try {
    const res = await createCoupleApi({
      couple_name: coupleName,
      anniversary_date: anniversaryDate,
    });
    if (res?.couple_id) {
      const { data: cData } = await supabase.from('couples').select('*').eq('id', res.couple_id).maybeSingle();
      if (cData) return cData as Couple;
    }
  } catch (apiErr) {
    console.warn('[RelationshipService] Backend createCouple fallback notice:', apiErr);
  }

  // 3. Fallback: Direct insert if permitted
  const { data: newCouple, error: insertError } = await supabase
    .from('couples')
    .insert({
      couple_name: coupleName || 'Our Shared Sanctuary',
      anniversary_date: anniversaryDate || null,
      partner_name: partnerName || null,
      partner_birthday: partnerBirthday || null,
    })
    .select()
    .single();

  if (insertError || !newCouple) {
    throw new Error(insertError?.message || 'Failed to create couple record in sanctuary');
  }

  return newCouple as Couple;
}

/**
 * Update couple settings (Anniversary date, couple name, partner birthday, etc.)
 */
export async function updateCoupleDetails(
  coupleId: string,
  updates: Partial<Couple>
): Promise<Couple> {
  if (isPlaceholder) {
    return {
      id: coupleId,
      couple_name: updates.couple_name || "Alex & Maya's Sanctuary",
      anniversary_date: updates.anniversary_date || '2023-02-14',
      partner_name: updates.partner_name || 'Maya',
      partner_birthday: updates.partner_birthday || '2001-08-25',
      invite_code: updates.invite_code || 'LOVE-10001',
      partner_1_id: 'demo-user-1',
      partner_2_id: 'demo-user-2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase
      .from('couples')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', coupleId)
      .select()
      .single();

    if (error || !data) {
      console.error('[RelationshipService] Update couple error:', error?.message);
      throw new Error(error?.message || 'Failed to update sanctuary details');
    }

    return data as Couple;
  } catch (err) {
    console.error('[RelationshipService] Error updating couple:', err);
    throw err;
  }
}

