<script lang="ts">
    import { page } from '$app/stores';
    import '../app.css';
    import BottomNav from '$lib/components/BottomNav.svelte';
    import { user } from '$lib/stores/authStore';
    import { onMount, onDestroy } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
    import { navigating } from '$app/stores';
    let unsubscribe: (() => void) | undefined;

    onMount(async () => {
        try {
            // 获取初始会话状态
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                user.set(session.user);
                console.log('Initial session loaded:', session.user.email);
            } else if (!$page.url.pathname.startsWith('/login')) {
                // 只在非登录页面且没有会话时重定向
                goto('/login', { replaceState: true });
                return;
            }
            
            // 修复订阅实现
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session?.user?.email);
                if (session?.user) {
                    user.set(session.user);
                } else if (!$page.url.pathname.startsWith('/login')) {
                    user.set(null);
                    goto('/login', { replaceState: true });
                }
            });

            unsubscribe = () => subscription.unsubscribe();
            
        } catch (error) {
            console.error('Session initialization error:', error);
            if (!$page.url.pathname.startsWith('/login')) {
                goto('/login', { replaceState: true });
            }
        }
    });

    onDestroy(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });

    let { children } = $props();
</script>

{#if $navigating}
    <div class="loading">Loading...</div>
{/if}
<div class="app">
	<main>
		{@render children()}
	</main>
	{#if $user}
		<BottomNav />
	{/if}
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		padding: 1rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
	.loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #0066cc;
        color: white;
        text-align: center;
        padding: 0.5rem;
        z-index: 1000;
    }
</style>
