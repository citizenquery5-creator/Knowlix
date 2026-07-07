import { supabase } from './supabase';
import { Profile, Subscription } from './types';

export interface AccessResult {
  canDownload: boolean;
  reason: string;
  plan: string;
  trialDaysRemaining: number;
  subscription: Subscription | null;
}

export async function checkDownloadAccess(
  user: { id: string } | null,
  profile: Profile | null,
  doc: { is_premium: boolean; is_downloadable: boolean }
): Promise<AccessResult> {
  if (!user || !profile) {
    return { canDownload: false, reason: 'login_required', plan: 'none', trialDaysRemaining: 0, subscription: null };
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const subscription = sub as Subscription | null;
  const plan = subscription?.plan ?? 'free';
  const status = subscription?.status ?? 'active';

  const now = new Date();
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
  const isExpired = expiresAt ? expiresAt < now : false;

  if (plan === 'free' || plan === 'free_trial') {
    if (isExpired || status !== 'active') {
      return { canDownload: false, reason: 'trial_expired', plan, trialDaysRemaining: 0, subscription };
    }
    const trialDaysRemaining = expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    if (doc.is_premium) {
      return { canDownload: false, reason: 'premium_required', plan, trialDaysRemaining, subscription };
    }
    return { canDownload: true, reason: 'ok', plan, trialDaysRemaining, subscription };
  }

  if (plan === 'pro' || plan === 'premium') {
    if (isExpired || status !== 'active') {
      return { canDownload: false, reason: 'subscription_expired', plan, trialDaysRemaining: 0, subscription };
    }
    return { canDownload: true, reason: 'ok', plan, trialDaysRemaining: 0, subscription };
  }

  return { canDownload: false, reason: 'no_plan', plan: 'none', trialDaysRemaining: 0, subscription };
}

export async function startFreeTrial(userId: string): Promise<{ error: string | null }> {
  const { data: settingsData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'free_trial_days')
    .maybeSingle();

  const trialDays = parseInt(settingsData?.value ?? '2', 10);
  const startsAt = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + trialDays);

  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    plan: 'free',
    status: 'active',
    starts_at: startsAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  }, { onConflict: 'user_id' });

  return { error: error?.message ?? null };
}

export function getTrialDaysRemaining(subscription: Subscription | null): number {
  if (!subscription || !subscription.expires_at) return 0;
  const now = new Date();
  const expiresAt = new Date(subscription.expires_at);
  if (expiresAt < now) return 0;
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}
