<template>
  <ion-page>
    <ion-content class="ion-padding" style="--background: white;">
      <div class="relative h-screen w-full overflow-hidden flex items-center justify-center max-w-sm">
        <div class="absolute -top-[340px] right-0 w-[600px] h-[600px] bg-[#45BEFF] rounded-full blur-[50px] -z-10"></div>
        <div class="absolute -bottom-[340px] right-0 w-[600px] h-[600px] bg-[#45BEFF] rounded-full blur-[50px] -z-10 animate-blob-float"></div>

        <div class="flex w-full h-full relative flex-col gap-6">
          <div class="bg-white/80 backdrop-blur-xl flex-1 rounded-b-2xl p-8 flex flex-col gap-4 justify-between shadow-lg">
            <div class="flex flex-col items-center justify-center">
              <h1 class="text-6xl font-bold text-[#57595B]">Welcome To</h1>
              <div class="flex items-end mt-4">
                <img src="/logo.png" class="w-[120px]" alt="">
                <h1 class="text-6xl font-bold text-[#57595B]">epla</h1>
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <div>
                <label for="email" class="text-xl text-[#57595B]">Email</label>
                <input v-model="email" type="email" id="email" placeholder="email@example.com" class="w-full p-2 text-[#57595B] bg-white/0 outline-none border-b border-[#57595B] focus:border-[#45BEFF] transition-colors">
              </div>
              <div>
                <label for="password" class="text-xl text-[#57595B]">Password</label>
                <div class="relative">
                  <input v-model="password" :type="showPassword ? 'text' : 'password'" id="password" class="w-full p-2 text-[#57595B] bg-white/0 outline-none border-b border-[#57595B] focus:border-[#45BEFF] transition-colors">
                  <button type="button" class="absolute right-0 bottom-2 text-[#57595B]" @click="showPassword = !showPassword">
                    <Icon :name="showPassword ? 'mdi:eye' : 'mdi:eye-off'" class="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="text-white pb-12 flex flex-col gap-2 items-center justify-center p-4">
            <button @click="handleSignIn" :disabled="loading" class="w-full p-6 flex items-center justify-center backdrop-blur-xl bg-white/20 text-3xl rounded-full shadow-lg text-[#57595B] font-semibold">
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
            <h1 class="text-[#57595B] text-sm">Dont have an account? <NuxtLink to="/register" class="text-white pl-2">Sign Up</NuxtLink></h1>
            
            <ul class="flex gap-2 mt-2">
              <button @click="handleSocialSignIn('google')" class="backdrop-blur-xl bg-white/20 rounded-full px-4 p-2 flex items-center justify-center">
                <Icon name="logos:google-icon" class="scale-150" />
              </button>
              <button @click="handleSocialSignIn('github')" class="backdrop-blur-xl bg-white/20 rounded-full p-4 flex items-center justify-center">
                <Icon name="mdi:github" class="scale-150 text-white" />
              </button>
              <button @click="handleSocialSignIn('facebook')" class="backdrop-blur-xl bg-white/20 rounded-full p-4 flex items-center justify-center">
                <Icon name="logos:facebook" class="scale-150" />
              </button>
            </ul>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

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
    // Wait a moment for session to be fully established
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

async function handleSocialSignIn(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${window.location.origin}/contact`,
    },
  })
  if (error) alert(`Error signing in with ${provider}: ${error.message}`)
}
</script>