# Nuxt.js + Capacitor Authentication Debug Guide

## Problem Overview

When packaging a Nuxt.js application with Supabase authentication as a mobile app using Capacitor, users can log in successfully but API calls to server routes fail with "Unauthorized" errors.

## Root Cause Analysis

### The Issue
- **Web Environment**: Supabase uses HTTP cookies to maintain session state automatically
- **Capacitor WebView**: Does not handle cookies the same way as browsers
- **API Calls**: Server routes expect cookie-based authentication but receive none

### Why This Happens
1. **Cookie Handling**: Capacitor's WebView doesn't automatically send session cookies with API requests
2. **Session Storage**: Mobile apps need explicit token management instead of relying on browser cookies
3. **CORS & Security**: Mobile environments have different security constraints than web browsers

## Solution Architecture

### 1. Client-Side: useApi Composable
**File**: `composables/useApi.ts`

```typescript
export const useApi = () => {
  const { $supabase } = useNuxtApp()
  const config = useRuntimeConfig()
  
  const apiCall = async (url: string, options: any = {}) => {
    // Get current session
    const { data: { session }, error: sessionError } = await $supabase.auth.getSession()
    
    // Prepare headers with Authorization Bearer token
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    // Add Authorization header if session exists
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    } else {
      // Try to refresh session if no token
      const { data: { session: refreshedSession }, error: refreshError } = await $supabase.auth.refreshSession()
      
      if (refreshError || !refreshedSession?.access_token) {
        throw createError({ statusCode: 401, statusMessage: 'No valid session' })
      }
      
      headers.Authorization = `Bearer ${refreshedSession.access_token}`
    }
    
    // Make API call with Bearer token
    return await $fetch(url, {
      baseURL: config.public.apiBase,
      ...options,
      headers
    })
  }
  
  return {
    get: (url: string, options?: any) => apiCall(url, { ...options, method: 'GET' }),
    post: (url: string, body?: any, options?: any) => apiCall(url, { ...options, method: 'POST', body }),
    put: (url: string, body?: any, options?: any) => apiCall(url, { ...options, method: 'PUT', body }),
    delete: (url: string, options?: any) => apiCall(url, { ...options, method: 'DELETE' }),
    $raw: apiCall
  }
}
```

### 2. Server-Side: Authorization Header Support
**File**: `server/api/chat/get-or-create.post.ts`

```typescript
export default defineEventHandler(async (event) => {
  // Debug logging
  const authHeader = getHeader(event, 'authorization')
  console.log('DEBUG: Authorization header:', authHeader)
  
  const user = await serverSupabaseUser(event);
  console.log('DEBUG: User from serverSupabaseUser:', user)
  
  if (!user) {
    console.log('DEBUG: No user found, returning 401')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  
  // Continue with authenticated logic...
});
```

### 3. Nuxt Configuration for Capacitor
**File**: `nuxt.config.ts`

```typescript
supabase: {
  redirectOptions: {
    login: '/',
    callback: '/auth/callback',
    exclude: ['/register','/'],
  },
  cookieOptions: {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: false // Set to false for Capacitor development
  },
  cookiePrefix: 'sb-auth-token', // Use cookiePrefix instead of deprecated cookieName
  clientOptions: {
    auth: {
      persistSession: true,
      storage: 'localStorage' // Use localStorage for mobile compatibility
    }
  }
}
```

### 4. Enhanced Login Flow
**File**: `app/pages/index.vue`

```typescript
async function handleSignIn() {
  loading.value = true
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  
  if (error) {
    alert(error.message)
  } else {
    console.log('DEBUG: Sign in successful, session:', data.session)
    
    // Wait for session to be fully established
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Verify session before navigating
    const { data: { session } } = await supabase.auth.getSession()
    console.log('DEBUG: Session after delay:', session)
    
    if (session) {
      navigateTo('/contact')
    } else {
      alert('Login successful but session not established. Please try again.')
    }
  }
  loading.value = false
}
```

### 5. Capacitor Configuration
**File**: `capacitor.config.json`

```json
{
  "appId": "io.ionic.starter",
  "appName": "Repla", 
  "webDir": "dist",
  "server": {
    "url": "https://repla-theta.vercel.app",
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 3000,
      "backgroundColor": "#45BEFF"
    }
  }
}
```

## Why capacitor.config.json Matters

### The Issue with Default Config
The default Capacitor configuration doesn't specify:
1. **Server URL**: API calls may fail due to CORS or network issues
2. **CORS Settings**: Mobile apps need explicit server configuration
3. **Security Context**: WebView security policies differ from browsers

### Key Configuration Options
- `server.url`: Explicitly sets the API server URL
- `server.cleartext`: Allows HTTP connections during development
- `plugins`: Configure Capacitor plugins for proper mobile behavior

## Debugging Steps

### 1. Enable Debug Logging
Add console.log statements to track:
- Session data after login
- Authorization headers in API calls
- Server-side authentication status

### 2. Check Network Requests
Use browser dev tools or Android Studio Logcat to:
- Verify Authorization headers are being sent
- Check for CORS errors
- Monitor API response codes

### 3. Test Session Persistence
- Login and immediately navigate to chat
- Close and reopen the app
- Verify session remains active

## Common Error Patterns

### Error: "Failed to load chat. Please try logging in again"
**Cause**: Session not established when navigating to chat page
**Solution**: Add session verification and delay before navigation

### Error: "Connection Error" with 401 status
**Cause**: Authorization header not being sent or invalid
**Solution**: Check useApi composable and session management

### Error: "No valid session after refresh"
**Cause**: Session refresh failing due to storage issues
**Solution**: Ensure localStorage is configured in nuxt.config.ts

## Implementation Checklist

- [ ] Create/useApi composable with Bearer token support
- [ ] Update all API calls to use useApi instead of $fetch
- [ ] Configure nuxt.config.ts for Capacitor session persistence
- [ ] Update capacitor.config.json with server URL
- [ ] Add debug logging to login flow
- [ ] Test authentication flow end-to-end
- [ ] Verify session persistence across app restarts

## Testing Strategy

### 1. Web Environment Testing
- Verify authentication works in browser
- Check cookie-based session management
- Test API calls with browser dev tools

### 2. Mobile Environment Testing
- Deploy APK to device/emulator
- Test login flow with debug logging
- Verify API calls include Authorization headers
- Test session persistence across app restarts

### 3. Error Scenarios
- Test with expired tokens
- Test with network connectivity issues
- Test session refresh behavior
- Test logout and re-login flow

## Future Improvements

1. **Token Refresh Logic**: Implement proactive token refresh
2. **Offline Support**: Add local storage for offline functionality
3. **Error Handling**: Create comprehensive error recovery mechanisms
4. **Security**: Implement token revocation and secure storage
5. **Performance**: Optimize session checking and API call patterns

## Conclusion

This authentication issue stems from the fundamental difference between web browser cookie handling and Capacitor WebView behavior. The solution involves explicitly managing session tokens and ensuring proper configuration across the entire stack - from client-side composables to server-side middleware and mobile app configuration.

The key insight is that mobile apps require explicit token management rather than relying on automatic cookie handling, which is why the useApi composable with Bearer token support is essential for unified authentication behavior across web and mobile platforms.
