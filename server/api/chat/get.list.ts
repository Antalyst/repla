
import { serverSupabaseServiceRole, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const client = serverSupabaseServiceRole(event);
  
  const { data: chats, error } = await client
    .from('chats') 
    .select('*')
    .eq('user_id', user.id) 
    .order('updated_at', { ascending: false });

  return chats || [];
});