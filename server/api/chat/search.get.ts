
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {

  const client = serverSupabaseServiceRole(event);

  const query = getQuery(event);
  const searchTerm = (query.q as string) || '';

  if (!searchTerm) return [];

 const { data, error } = await client
    .from('messages')
    .select('id, content, role, chat_id, chats!inner(user_id), created_at') 
    .ilike('content', `%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("DEBUG: Supabase Error:", error);
    return [];
  }

  return data || [];
});