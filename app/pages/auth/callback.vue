<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="text-center">
        <h2 class="text-xl font-semibold">Logging you in...</h2>
        <div class="mt-4">
          <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
 
  const client = useSupabaseClient()
  const route = useRoute()

  onMounted(async () => {
    const { error } = await client.auth.exchangeCodeForSession(route.query.code)
    if (!error) {
      navigateTo('/')
    }
  })
  </script>