import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  // Debug logging
  const authHeader = getHeader(event, 'authorization')
  console.log('DEBUG: Authorization header:', authHeader)
  
  let user = null;
  
  // Try to get user from Bearer token first (for mobile/Capacitor)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const { data: { user: supabaseUser }, error } = await serverSupabaseServiceRole(event).auth.getUser(token);
      
      if (!error && supabaseUser) {
        user = supabaseUser;
        console.log('DEBUG: User from Bearer token:', user)
      } else {
        console.log('DEBUG: Bearer token invalid:', error)
      }
    } catch (e) {
      console.error('DEBUG: Error validating Bearer token:', e)
    }
  }
  
  // Fallback to cookie-based auth (for web)
  if (!user) {
    try {
      user = await serverSupabaseUser(event);
      console.log('DEBUG: User from cookie auth:', user)
    } catch (e) {
      console.log('DEBUG: Cookie auth failed:', e)
    }
  }
  
  if (!user) {
    console.log('DEBUG: No user found from any auth method, returning 401')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

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