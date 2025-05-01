import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,  // 确保会话持久化
        autoRefreshToken: true, // 自动刷新令牌
        detectSessionInUrl: true // 检测URL中的会话信息
    }
}) 