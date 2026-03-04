// Example usage of useApi composable
// This file demonstrates how to use the useApi composable in your components

// Example 1: Basic usage in a component
<script setup lang="ts">
const { get, post } = useApi()

// Fetch user data
const { data: userData } = await get('/api/auth/me')

// Create a new chat
const { data: newChat } = await post('/api/chat/create', {
  title: 'My New Chat'
})

// Send a message
const { data: response } = await post('/api/chat/send', {
  chatId: 'chat-id-here',
  message: 'Hello, AI!'
})
</script>

// Example 2: Error handling
<script setup lang="ts">
const { get } = useApi()

try {
  const { data } = await get('/api/chat/list')
  console.log('Chats:', data)
} catch (error) {
  if (error.statusCode === 401) {
    // User is not authenticated, redirect to login
    await navigateTo('/')
  } else {
    console.error('Failed to fetch chats:', error)
  }
}
</script>

// Example 3: Custom headers and options
<script setup lang="ts">
const api = useApi()

// Custom request with additional headers
const { data } = await api.$raw('/api/custom-endpoint', {
  method: 'POST',
  body: { customData: 'value' },
  headers: {
    'X-Custom-Header': 'custom-value'
  },
  query: {
    param1: 'value1'
  }
})
</script>
