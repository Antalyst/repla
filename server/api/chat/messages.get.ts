import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const client = serverSupabaseServiceRole(event);
  const userId = user.id || user.sub;
  const { data: chat, error: chatError } = await client
    .from('chats')
    .select('id')
    .eq('user_id', userId)
    .single();

  console.log("DEBUG: Querying for Chat ID:", chat?.id);

  if (chatError || !chat) return [];
  const { data: messages, error: msgError } = await client
    .from('messages')
    .select('*')
    .eq('chat_id', chat.id)
    .order('created_at', { ascending: true });

  if (msgError) throw createError({ statusCode: 500, statusMessage: msgError.message });
  
  return messages;
});