'use server'

import { createAdminClient, verifyAdminAccess } from '@/lib/supabase/admin'
import { getPaymentProvider, PaymentProvider } from '@/lib/payments'
import { cancelIsFinalAtProvider, type CancellationResult } from '@/lib/payments/types'
import { applySubscriptionCancellation, cancelProviderSubscription, resumeProviderSubscription } from '@/lib/payments/subscription-cancellation'
import { getCurrentTenantId } from '@/lib/supabase/tenant'
import { isSuperAdmin } from '@/lib/supabase/get-user-role'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'

/**
 * Cancel a subscription (immediately or at period end)
 */
export async function cancelSubscription(
  subscriptionId: number,
  immediate: boolean = false
) {
  const tErr = await getTranslations('actionErrors')
  try {
    // Verify admin access
    const hasAccess = await verifyAdminAccess()
    if (!hasAccess) {
      return { success: false, error: tErr('e10d9c06f') }
    }

    const tenantId = await getCurrentTenantId()
    const isSuperAdminUser = await isSuperAdmin()

    const supabase = createAdminClient()

    // Get subscription details and verify tenant ownership
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*, profiles(stripe_customer_id)')
      .eq('subscription_id', subscriptionId)
      .single()

    if (fetchError || !subscription) {
      return { success: false, error: tErr('ef3d57b2c') }
    }

    // Verify subscription belongs to tenant (unless super_admin)
    if (!isSuperAdminUser && subscription.tenant_id !== tenantId) {
      return { success: false, error: tErr('e23c40f30') }
    }

    // If the subscription is managed by an external provider, cancel it there
    // first (provider-agnostic). Manual subscriptions no-op. We still update our
    // own row below regardless, so a provider error shouldn't strand the admin —
    // but we no longer swallow it silently: some providers (e.g. solana_subs)
    // cannot cancel server-side, and reporting a clean success while the
    // provider-side authorization is still live is the money leak in #460. We
    // surface the message so the UI can warn the admin.
    let providerCancelError: string | undefined
    let cancellationResult: CancellationResult | undefined
    if (subscription.provider_subscription_id) {
      try {
        const provider = getPaymentProvider(
          (subscription.payment_provider as PaymentProvider) || 'stripe'
        )
        cancellationResult = await cancelProviderSubscription(provider, subscription.provider_subscription_id, immediate)
      } catch (providerError) {
        providerCancelError =
          providerError instanceof Error ? providerError.message : String(providerError)
        console.error('Provider cancelSubscription failed (continuing to update DB):', providerError)
      }
    }

    await applySubscriptionCancellation(supabase, subscriptionId, {
      immediate, result: cancellationResult,
    })

    // For immediate termination, the trigger revokes subscription entitlements.
    // For period-end cancellation, independently purchased access stays intact
    // and subscription access stays active until the cron job
    // or a future webhook fires when the period ends.

    // Revalidate the subscriptions page
    revalidatePath('/dashboard/admin/subscriptions')

    // `providerCancelError` is set when the DB row was canceled but the provider
    // could not be canceled server-side (e.g. solana_subs needs the student's
    // wallet signature). The cancel still succeeded on our side; the UI turns
    // this into a warning rather than a plain success.
    return { success: true, providerCancelError }
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return { success: false, error: tErr('e0e715593') }
  }
}

/**
 * Reactivate a subscription that was scheduled to cancel
 */
export async function reactivateSubscription(subscriptionId: number) {
  const tErr = await getTranslations('actionErrors')
  try {
    // Verify admin access
    const hasAccess = await verifyAdminAccess()
    if (!hasAccess) {
      return { success: false, error: tErr('e10d9c06f') }
    }

    const tenantId = await getCurrentTenantId()
    const isSuperAdminUser = await isSuperAdmin()

    const supabase = createAdminClient()

    // Get subscription details and verify tenant ownership
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .single()

    if (fetchError || !subscription) {
      return { success: false, error: tErr('ef3d57b2c') }
    }

    // Verify subscription belongs to tenant (unless super_admin)
    if (!isSuperAdminUser && subscription.tenant_id !== tenantId) {
      return { success: false, error: tErr('e23c40f30') }
    }

    // Only reactivate if it was scheduled to cancel
    if (!subscription.cancel_at_period_end) {
      return { success: false, error: tErr('e0e2128ed') }
    }

    if (!['active', 'renewed', 'past_due'].includes(subscription.subscription_status)
      || !(Date.parse(subscription.current_period_end ?? subscription.end_date) > Date.now())) {
      return { success: false, error: 'not_reactivatable' }
    }

    // Final-at-provider cancels cannot resume: un-flagging the row would show
    // a renewing subscription that never bills again.
    if (subscription.provider_subscription_id && cancelIsFinalAtProvider(subscription.payment_provider)) {
      return {
        success: false,
        error: tErr('e3e9043c2'),
      }
    }

    // Reverse the provider-side cancel too. A DB-only reactivate would leave the
    // provider (e.g. Stripe) still set to cancel at period end, so the sub would
    // lapse anyway. A provider error leaves the cancellation schedule intact.
    if (subscription.provider_subscription_id) {
      try {
        const provider = getPaymentProvider(
          (subscription.payment_provider as PaymentProvider) || 'stripe'
        )
        await resumeProviderSubscription(provider, subscription.provider_subscription_id)
      } catch (providerError) {
        console.error('Provider reactivateSubscription failed:', providerError)
        return { success: false, error: tErr('e34caa3b2') }
      }
    }

    // Reactivate the subscription. `cancel_at` is cleared WITH the flag: since
    // #545 it is nullable and the CHECK
    // `subscriptions_cancel_at_requires_schedule` rejects a cancel date that
    // outlives its schedule, so a leftover date can no longer be read as a live
    // cancel by the Solana auto-pull crank. `canceled_at` is cleared too.
    const { data: resumed, error: updateError } = await supabase.rpc('resume_subscription', {
      _subscription_id: subscriptionId,
    })
    if (updateError || !resumed) {
      if (subscription.provider_subscription_id) {
        try {
          const provider = getPaymentProvider((subscription.payment_provider as PaymentProvider) || 'stripe')
          await cancelProviderSubscription(provider, subscription.provider_subscription_id, false)
        } catch (providerError) {
          console.error('Resume compensation requires provider reconciliation:', providerError)
        }
      }
      return { success: false, error: updateError ? 'update_failed' : 'not_reactivatable' }
    }
    // Revalidate the subscriptions page
    revalidatePath('/dashboard/admin/subscriptions')

    return { success: true }
  } catch (error) {
    console.error('Reactivate subscription error:', error)
    return { success: false, error: tErr('e0e715593') }
  }
}

/**
 * Get subscription details with full information
 */
export async function getSubscriptionDetails(subscriptionId: number) {
  const tErr = await getTranslations('actionErrors')
  try {
    const hasAccess = await verifyAdminAccess()
    if (!hasAccess) {
      return { success: false, error: tErr('e10d9c06f'), data: null }
    }

    const tenantId = await getCurrentTenantId()
    const isSuperAdminUser = await isSuperAdmin()

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        profiles!subscriptions_user_profile_fkey (
          full_name,
          email,
          stripe_customer_id
        ),
        plans (
          plan_name,
          price,
          currency,
          duration_type,
          features
        )
      `
      )
      .eq('subscription_id', subscriptionId)
      .single()

    if (error) {
      return { success: false, error: tErr('ef3d57b2c'), data: null }
    }

    // Verify subscription belongs to tenant (unless super_admin)
    if (!isSuperAdminUser && data.tenant_id !== tenantId) {
      return { success: false, error: tErr('e23c40f30'), data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Get subscription details error:', error)
    return { success: false, error: tErr('e0e715593'), data: null }
  }
}
