<template>
  <ion-page>
    <ion-content class="ion-padding" style="--background: white;">
      <div class="relative h-screen w-full overflow-hidden flex items-center justify-center max-w-sm">
        <div class="absolute -top-[340px] right-0 w-[600px] h-[600px] bg-[#45BEFF] rounded-full blur-[50px] -z-10"></div>
        <div class="absolute -bottom-[340px] right-0 w-[600px] h-[600px] bg-[#45BEFF] rounded-full blur-[50px] -z-10 animate-blob-float"></div>

        <div class="flex w-full h-full relative flex-col gap-6">
          <div class="bg-white/80 backdrop-blur-xl flex-1 rounded-b-2xl p-8 flex flex-col gap-4 justify-between shadow-lg">
            <div class="flex items-end justify-center">
              <img src="/logo.png" class="w-[75px]" alt="">
              <h1 class="text-4xl font-bold text-[#57595B]">epla</h1>
            </div>

            <div class="flex flex-col gap-4">
              <div>
                <label for="name" class="text-lg text-[#57595B]">Display Name</label>
                <input v-model="DisplayName" type="text" id="name" placeholder="John Doe" class="w-full p-2 text-[#57595B] bg-white/0 outline-none border-b border-[#57595B] focus:border-[#45BEFF] transition-colors">
              </div>
              <div>
                <label for="email" class="text-lg text-[#57595B]">Email</label>
                <input v-model="email" type="email" id="email" placeholder="email@example.com" class="w-full p-2 text-[#57595B] bg-white/0 outline-none border-b border-[#57595B] focus:border-[#45BEFF] transition-colors">
              </div>
              <div>
                <label for="password" class="text-lg text-[#57595B]">Password</label>
                <input v-model="password" type="password" id="password" placeholder="••••••••" class="w-full p-2 text-[#57595B] bg-white/0 outline-none border-b border-[#57595B] focus:border-[#45BEFF] transition-colors">
              </div>
              <div>
                <label for="confirm" class="text-lg text-[#57595B]">Confirm Password</label>
                <input v-model="confirmPassword" type="password" id="confirm" placeholder="••••••••" class="w-full p-2 text-[#57595B] bg-white/0 outline-none border-b border-[#57595B] focus:border-[#45BEFF] transition-colors">
              </div>
            </div>
          </div>

          <div class="text-white pb-12 flex flex-col gap-2 items-center justify-center p-4">
            <button @click="handleSignUp" :disabled="loading" class="w-full p-6 flex items-center justify-center backdrop-blur-xl bg-white/20 text-3xl rounded-full shadow-lg text-[#57595B] font-semibold">
              {{ loading ? 'Creating...' : 'Sign Up' }}
            </button>
            <h1 class="text-[#57595B] text-sm">Already have an account? <NuxtLink to="/" class="text-white pl-2">Sign In</NuxtLink></h1>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
const email = ref('')
const DisplayName = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

async function handleSignUp() {
  if (password.value !== confirmPassword.value) {
    alert("Passwords do not match!")
    return
  }
  loading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
        display_name: DisplayName.value,
      },
    })

    alert("Registration successful! You can now sign in.")
    navigateTo('/') 
  } catch (err: any) {
    alert(err.data?.statusMessage || "An error occurred during registration.")
  } finally {
    loading.value = false
  }
}
</script>