import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
    try {
        // 确保从本地存储恢复会话
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        return { 
            session: {
                user: session?.user ?? null,
                expiresAt: session?.expires_at ?? null
            }
        };
    } catch (error) {
        console.error('Session error:', error);
        return { session: null };
    }
};