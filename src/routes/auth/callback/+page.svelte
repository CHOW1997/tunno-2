<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores/authStore';

    onMount(async () => {
        try {
            // 从 URL 获取 hash 参数
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const access_token = hashParams.get('access_token');
            const refresh_token = hashParams.get('refresh_token');

            if (!access_token || !refresh_token) {
                // 尝试从 URL 查询参数获取
                const queryParams = new URLSearchParams(window.location.search);
                const code = queryParams.get('code');
                
                if (code) {
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;
                    if (data.session) {
                        user.set(data.session.user);
                        goto('/analytics', { replaceState: true });
                        return;
                    }
                }
            } else {
                // 使用 hash 参数中的 token
                const { data: { session }, error } = await supabase.auth.setSession({
                    access_token,
                    refresh_token
                });

                if (error) throw error;
                if (session) {
                    user.set(session.user);
                    goto('/analytics', { replaceState: true });
                    return;
                }
            }

            // 如果以上都失败，重定向到登录页
            console.error('无效的会话');
            goto('/login', { replaceState: true });
        } catch (e) {
            console.error('验证过程中出错:', e);
            goto('/login', { replaceState: true });
        }
    });
</script>

<div class="min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 class="text-center text-3xl font-extrabold text-gray-900">
            正在验证邮箱...
        </h2>
    </div>
</div>