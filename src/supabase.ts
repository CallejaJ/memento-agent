import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  membership_tier: string;
  telegram_username: string | null;
}

export interface GameStats {
  total_sessions: number;
  best_score: number;
  max_streak: number;
  total_rewarded: number;
}

export async function getProfileByTelegramUsername(username: string): Promise<UserProfile | null> {
  const clean = username.replace('@', '').toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, membership_tier, telegram_username')
    .ilike('telegram_username', clean)
    .single();
  if (error || !data) return null;
  return data as UserProfile;
}

export async function getGameStats(userId: string): Promise<GameStats | null> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('score, max_streak, rewarded')
    .eq('user_id', userId)
    .not('finished_at', 'is', null);
  if (error || !data) return null;
  return {
    total_sessions: data.length,
    best_score: Math.max(...data.map((s) => s.score ?? 0), 0),
    max_streak: Math.max(...data.map((s) => s.max_streak ?? 0), 0),
    total_rewarded: data.filter((s) => s.rewarded).length,
  };
}

export async function getCourseProgress(userId: string): Promise<{ course_id: string; progress_percentage: number }[]> {
  const { data, error } = await supabase
    .from('course_progress')
    .select('course_id, progress_percentage')
    .eq('user_id', userId)
    .order('progress_percentage', { ascending: false });
  if (error || !data) return [];
  return data;
}
