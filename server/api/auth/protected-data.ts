
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const supabase = await serverSupabaseClient(event)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
  if (error) throw error
  return data
})