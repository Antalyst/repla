// server/api/chat/list.get.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const userId = user.id || user.sub 

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('chats')
    .select('*')
    .eq('user_id', userId) // Fix: use userId variable
    .order('created_at', { ascending: false })
  
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})