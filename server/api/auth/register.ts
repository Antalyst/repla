import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, confirmPassword, Display_name } = body

  if (password !== confirmPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Passwords do not match' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password too short' })
  }

  const client = await serverSupabaseClient(event);

  const { data, error } = await client.auth.signUp({
    email,
    password,
    user_metadata: { Display_name } ,
    email_confirm: true,
  } as any);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true, user: data.user }
})
