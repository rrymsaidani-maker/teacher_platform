'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/supabase/tenant'
import { getTranslations } from 'next-intl/server'

// Community notification preferences (issue #870). `notification_preferences`
// is global per user — one row, every school — and RLS lets a user insert and
// update only their own row, so the user-scoped client is all this needs: no
// service role, no tenant check.

export type CommunityPreferenceKey = 'replies' | 'prompts' | 'mentions'

const COLUMN: Record<CommunityPreferenceKey, 'community_replies' | 'community_prompts' | 'community_mentions'> = {
  replies: 'community_replies',
  prompts: 'community_prompts',
  mentions: 'community_mentions', // #876
}

/**
 * Turn one community category on or off. Off means no notification of that
 * kind at all — the triggers skip the recipient, so neither the in-app row nor
 * its push is ever created. Other columns of the row are left alone; a row
 * created here gets the table defaults for everything else.
 */
export async function setCommunityNotificationPreference(
  key: CommunityPreferenceKey,
  enabled: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  const tErr = await getTranslations('actionErrors')
  if (!Object.hasOwn(COLUMN, key) || typeof enabled !== 'boolean') {
    return { success: false, error: tErr('e04eb7762') }
  }

  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: tErr('e0c91acba') }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, [COLUMN[key]]: enabled }, { onConflict: 'user_id' })

    if (error) {
      console.error('setCommunityNotificationPreference:', error)
      return { success: false, error: tErr('e487cabef') }
    }

    revalidatePath('/[locale]/dashboard/notifications', 'page')
    return { success: true }
  } catch (error) {
    console.error('setCommunityNotificationPreference:', error)
    return { success: false, error: tErr('e487cabef') }
  }
}
