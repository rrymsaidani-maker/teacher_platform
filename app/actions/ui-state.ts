'use server'

import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'

// Mutations for user_ui_state (issue #452). RLS restricts rows to the caller,
// so the regular server client is enough — no admin client, no tenant check
// (the table is global per-user, like profiles).

// Same vocabulary as lib/ui-state-keys.ts: tour completion, checklist
// dismissal, and the "Show tips & tours" setting.
const ALLOWED_KEY = /^(tour:[a-z0-9-]+|checklist:[a-z0-9-]+|tours_enabled)$/

type UiStateValue = string | number | boolean

export async function setUiState(key: string, value: UiStateValue) {
  const tErr = await getTranslations('actionErrors')
  try {
    if (!ALLOWED_KEY.test(key)) {
      return { success: false as const, error: tErr('ebfe28e06') }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false as const, error: tErr('e0c91acba') }
    }

    const { error } = await supabase
      .from('user_ui_state')
      .upsert(
        { user_id: user.id, key, value },
        { onConflict: 'user_id,key' }
      )

    if (error) {
      return { success: false as const, error: error.message }
    }
    return { success: true as const }
  } catch (error) {
    console.error('setUiState error:', error)
    return { success: false as const, error: tErr('e0e715593') }
  }
}

export async function clearUiState(key: string) {
  const tErr = await getTranslations('actionErrors')
  try {
    if (!ALLOWED_KEY.test(key)) {
      return { success: false as const, error: tErr('ebfe28e06') }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false as const, error: tErr('e0c91acba') }
    }

    const { error } = await supabase
      .from('user_ui_state')
      .delete()
      .eq('user_id', user.id)
      .eq('key', key)

    if (error) {
      return { success: false as const, error: error.message }
    }
    return { success: true as const }
  } catch (error) {
    console.error('clearUiState error:', error)
    return { success: false as const, error: tErr('e0e715593') }
  }
}
