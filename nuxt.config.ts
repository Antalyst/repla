import 'dotenv/config'; // Add this line!
import { defineNuxtConfig } from 'nuxt/config';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/ionic',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@nuxtjs/supabase'
  ],
  supabase: {
    redirectOptions: {
      login: '/',
      callback: '/auth/callback',
      exclude: ['/register','/'],
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: false 
    },
    cookiePrefix: 'sb-auth-token',
    clientOptions: {
      auth: {
        persistSession: true,
        storage: 'localStorage'
      }
    }
  },
  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
      },
      apiBase: 'https://https://repla-theta.vercel.app'
    },
    groqApiKey: process.env.NUXT_GROQ_API_KEY ,
  }
})