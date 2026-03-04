import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const userId = user.id || user.sub;
  const client = serverSupabaseServiceRole(event);

  let { data: chat } = await client
    .from('chats')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!chat) {
    const { data: newChat, error } = await client
      .from('chats')
      .insert({ user_id: userId, title: 'Main Chat' })
      .select('id')
      .single();
    
    if (error) throw error;
    chat = newChat;
  }

  return chat; 
});