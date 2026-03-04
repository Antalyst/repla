
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server"

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    
    if (!user) {
        throw createError({ 
            statusCode: 401, 
            statusMessage: 'Unauthorized' 
        })
    }
    const supabase = await serverSupabaseClient(event)
    
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

    if (error) {    
        throw createError({ statusCode: 500, statusMessage: error.message + " 404" })
    }
    
    return { success: true, user: data }
})