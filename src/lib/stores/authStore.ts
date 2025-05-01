import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

const browser = typeof window !== 'undefined';

export const user = writable<User | null>(null, (set) => {
    if (browser) {
        // Only try to access localStorage in the browser
        const saved = localStorage.getItem('supabase.auth.token');
        if (saved) {
            try {
                set(JSON.parse(saved).user);
            } catch (error) {
                console.error('Failed to parse stored user data:', error);
            }
        }
    }
    
    return () => {}; // 清理函数
});
