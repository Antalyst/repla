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