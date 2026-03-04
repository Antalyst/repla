import { $fetch } from 'ofetch'

export const useApi = () => {
  const { $supabase } = useNuxtApp()
  const config = useRuntimeConfig()
  
  const apiCall = async (url: string, options: any = {}) => {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await $supabase.auth.getSession()
      
      console.log('DEBUG: Session data:', session)
      console.log('DEBUG: Session error:', sessionError)
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw sessionError
      }
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      }
      
      // Add Authorization header if session exists
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
        console.log('DEBUG: Added Authorization header')
      } else {
        console.warn('DEBUG: No access token found in session')
        // Try to refresh session
        const { data: { session: refreshedSession }, error: refreshError } = await $supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('Session refresh failed:', refreshError)
          throw createError({ statusCode: 401, statusMessage: 'No valid session' })
        }
        
        if (refreshedSession?.access_token) {
          headers.Authorization = `Bearer ${refreshedSession.access_token}`
          console.log('DEBUG: Added refreshed Authorization header')
        } else {
          throw createError({ statusCode: 401, statusMessage: 'No valid session after refresh' })
        }
      }
      
      console.log('DEBUG: Making API call to:', url)
      console.log('DEBUG: Headers:', headers)
      
      // Make the API call
      const response = await $fetch(url, {
        baseURL: config.public.apiBase,
        ...options,
        headers
      })
      
      return response
    } catch (error) {
      console.error('API call failed:', error)
      
      // Handle 401 errors - could refresh session or redirect to login
      if (error?.statusCode === 401) {
        console.log('DEBUG: Got 401, attempting session refresh')
        
        // Try to refresh the session
        const { data: { session }, error: refreshError } = await $supabase.auth.refreshSession()
        
        if (!refreshError && session?.access_token) {
          console.log('DEBUG: Session refreshed successfully, retrying request')
          
          // Retry the request with new token
          const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
            Authorization: `Bearer ${session.access_token}`
          }
          
          return await $fetch(url, {
            baseURL: config.public.apiBase,
            ...options,
            headers
          })
        } else {
          console.error('DEBUG: Session refresh failed:', refreshError)
          // Redirect to login if refresh fails
          await navigateTo('/')
        }
      }
      
      throw error
    }
  }
  
  return {
    get: (url: string, options?: any) => apiCall(url, { ...options, method: 'GET' }),
    post: (url: string, body?: any, options?: any) => apiCall(url, { ...options, method: 'POST', body }),
    put: (url: string, body?: any, options?: any) => apiCall(url, { ...options, method: 'PUT', body }),
    delete: (url: string, options?: any) => apiCall(url, { ...options, method: 'DELETE' }),
    $raw: apiCall
  }
}
