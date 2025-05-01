<script lang="ts">
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores/authStore';
    
    let email = '';
    let password = '';
    let loading = false;
    let error = '';
    let isLogin = true;

    async function handleAuth() {
        try {
            loading = true;
            if (isLogin) {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) {
                    error = signInError.message || 'Login failed, please check your email and password';
                    throw signInError;
                }
                // 设置用户状态
                if (data.user) {
                    user.set(data.user);
                }
            }
            // ... existing code ...
            goto('/analytics', { replaceState: true });
        } catch (e) {
            error = isLogin ? 'Login failed, please check your email and password' : 'Registration failed, please try again later';
            console.error(e);
        } finally {
            loading = false;
        }
        
    }
</script>

<div class="min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
            <h2 class="text-center text-3xl font-extrabold text-gray-900">
                <strong>{isLogin ? 'LogIn' : 'Register'}</strong>
            </h2>
        </div>
        <form class="mt-8 space-y-6" on:submit|preventDefault={handleAuth}>
            {#if error}
                <div class="text-red-500 text-sm">{error}</div>
            {/if}
            <div>
                <label for="email" class="sr-only">Email</label>
                <input
                    id="email"
                    type="email"
                    bind:value={email}
                    required
                    class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#ff4400] focus:border-[#ff4400]"
                    placeholder="Email"
                />
            </div>
            <div>
                <label for="password" class="sr-only">Password</label>
                <input
                    id="password"
                    type="password"
                    autocomplete="current-password"
                    bind:value={password}
                    required
                    class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#ff4400] focus:border-[#ff4400]"
                    placeholder="Password"
                />
            </div>
            <div>
                <button
                    type="submit"
                    disabled={loading}
                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#ff4400] hover:bg-[#cc3600] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff4400] disabled:opacity-50"
                >
                    {loading ? (isLogin ? 'Loging...' : 'Registering...') : (isLogin ? 'Log in' : 'Register')}
                </button>
            </div>

            <div class="text-center">
                <button
                    type="button"
                    class="text-sm text-[#ff4400] hover:text-[#cc3600]"
                    on:click={() => {
                        isLogin = !isLogin;
                        error = '';
                    }}
                >
                    {isLogin ? 'Sign up' : 'Returning user? Log in.'}
                </button>
            </div>
        </form>
    </div>
</div>