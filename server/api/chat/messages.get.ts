import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const client = serverSupabaseServiceRole(event);
  const userId = user.id || user.sub;
  
  // Get chatId from query params, fallback to user's first chat
  const query = getQuery(event);
  let targetChatId = query.chatId as string;
  
  if (!targetChatId) {
    // If no chatId provided, get user's first chat
    const { data: chat, error: chatError } = await client
      .from('chats')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (chatError || !chat) return [];
    targetChatId = chat.id;
  } else {
    // Verify the chat belongs to the user
    const { data: chat, error: chatError } = await client
      .from('chats')
      .select('id')
      .eq('id', targetChatId)
      .eq('user_id', userId)
      .single();
    
    if (chatError || !chat) return [];
  }

  console.log("DEBUG: Querying for Chat ID:", targetChatId);

  const { data: messages, error: msgError } = await client
    .from('messages')
    .select('*')
    .eq('chat_id', targetChatId)
    .order('created_at', { ascending: true });

  if (msgError) throw createError({ statusCode: 500, statusMessage: msgError.message });
  
  return messages;
});