'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getUserRole, isSuperAdmin } from '@/lib/supabase/get-user-role'
import {getCurrentTenantId, getCurrentUserId } from '@/lib/supabase/tenant'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'

type TemplateCategory = 'system' | 'course' | 'payment' | 'enrollment' | 'exam' | 'custom'

interface TemplateData {
  name: string
  title: string
  content: string
  category: TemplateCategory
  variables?: string[]
}

interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get all notification templates
 */
export async function getNotificationTemplates(
  category?: TemplateCategory
): Promise<ActionResponse> {
  const tErr = await getTranslations('actionErrors')
  try {
    const role = await getUserRole()
    if (role !== 'admin' && role !== 'teacher') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    let query = supabase
      .from('notification_templates')
      .select('*')
      .order('category')
      .order('name')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching templates:', error)
    return { success: false, error: tErr('eccae6794') }
  }
}

/**
 * Get single template
 */
export async function getNotificationTemplate(id: number): Promise<ActionResponse> {
  const tErr = await getTranslations('actionErrors')
  try {
    const role = await getUserRole()
    if (role !== 'admin' && role !== 'teacher') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching template:', error)
    return { success: false, error: tErr('e9d6c12e8') }
  }
}

/**
 * Create notification template
 */
export async function createNotificationTemplate(
  data: TemplateData
): Promise<ActionResponse> {
  const tErr = await getTranslations('actionErrors')
  try {
    const role = await getUserRole()
    const tenantId = await getCurrentTenantId()

    if (role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: tErr('e0c91acba') }
    }

    const adminClient = createAdminClient()

    const { data: template, error } = await adminClient
      .from('notification_templates')
      .insert({
        ...data,
        variables: data.variables || [],
        created_by: userId,
        tenant_id: tenantId
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/admin/notifications/templates')
    return { success: true, data: template }
  } catch (error) {
    console.error('Error creating template:', error)
    return { success: false, error: tErr('e21a704ee') }
  }
}

/**
 * Update notification template
 */
export async function updateNotificationTemplate(
  id: number,
  data: Partial<TemplateData>
): Promise<ActionResponse> {
  const tErr = await getTranslations('actionErrors')
  try {
    const role = await getUserRole()
    const tenantId = await getCurrentTenantId()
    const isSuperAdminUser = await isSuperAdmin()

    if (role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }

    const adminClient = createAdminClient()

    // Verify template belongs to tenant (unless super_admin)
    if (!isSuperAdminUser) {
      const { data: template, error: verifyError } = await adminClient
        .from('notification_templates')
        .select('tenant_id')
        .eq('id', id)
        .single()

      if (verifyError || !template || template.tenant_id !== tenantId) {
        return { success: false, error: tErr('ef03d9116') }
      }
    }

    const { data: template, error } = await adminClient
      .from('notification_templates')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/admin/notifications/templates')
    return { success: true, data: template }
  } catch (error) {
    console.error('Error updating template:', error)
    return { success: false, error: tErr('e56d2206f') }
  }
}

/**
 * Delete notification template
 */
export async function deleteNotificationTemplate(id: number): Promise<ActionResponse> {
  const tErr = await getTranslations('actionErrors')
  try {
    const role = await getUserRole()
    const tenantId = await getCurrentTenantId()
    const isSuperAdminUser = await isSuperAdmin()

    if (role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }

    const adminClient = createAdminClient()

    // Verify template belongs to tenant (unless super_admin)
    if (!isSuperAdminUser) {
      const { data: template, error: verifyError } = await adminClient
        .from('notification_templates')
        .select('tenant_id')
        .eq('id', id)
        .single()

      if (verifyError || !template || template.tenant_id !== tenantId) {
        return { success: false, error: tErr('ef03d9116') }
      }
    }

    const { error } = await adminClient
      .from('notification_templates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error

    revalidatePath('/dashboard/admin/notifications/templates')
    return { success: true }
  } catch (error) {
    console.error('Error deleting template:', error)
    return { success: false, error: tErr('ecd7811a5') }
  }
}

/**
 * Render template with variables
 */
export async function renderTemplate(
  template: string,
  variables: Record<string, string>
): Promise<string> {
  let rendered = template

  // Replace {{variable_name}} with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(regex, value)
  })

  return rendered
}
