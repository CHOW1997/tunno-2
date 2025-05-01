<script lang="ts">
    import { user } from '$lib/stores/authStore';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
    import { darkMode, notifications } from '$lib/stores/settingsStore';
    
    function toggleDarkMode() {
        $darkMode = !$darkMode;
        document.documentElement.classList.toggle('dark', $darkMode);
    }

    function toggleNotifications() {
        $notifications = !$notifications;
    }
    // 添加注销函数
    async function handleLogout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            $user = null;  // 清除用户状态
            goto('/login');
        } catch (error: any) {  // 添加类型声明
            console.error('注销失败:', error.message || error);
        }
    }
</script>

<div class="max-w-screen-xl">
    <h1 class="text-2xl font-bold mb-6">设置</h1>
    
    <div class="space-y-4">
        <div class="bg-white rounded-lg p-4 shadow">
            <h2 class="text-lg font-medium mb-2">主题设置</h2>
            <div class="flex items-center justify-between">
                <span class="text-gray-600">深色模式</span>
                <div 
                    role="switch"
                    tabindex="0"
                    aria-checked={$darkMode}
                    aria-label="切换深色模式"
                    on:click={toggleDarkMode}
                    on:keydown={(e) => e.key === 'Enter' && toggleDarkMode()}
                    class="w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out {$darkMode ? 'bg-[#ff4400]' : 'bg-gray-200'}"
                >
                    <div 
                        class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ease-in-out"
                        style="transform: translateX({$darkMode ? '1.65rem' : '0.125rem'})"
                    ></div>
                </div>

                <div class="flex items-center justify-between">
                    <span class="text-gray-600">任务提醒</span>
                    <button
                        role="switch"
                        aria-checked={$notifications}
                        aria-label="切换任务提醒"
                        class="w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out {$notifications ? 'bg-[#ff4400]' : 'bg-gray-200'}"
                        on:click={toggleNotifications}
                    >
                        <div 
                            class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ease-in-out"
                            style="transform: translateX({$notifications ? '1.65rem' : '0.125rem'})"
                        ></div>
                    </button>
                </div>
            </div>
        </div>

       

        <div class="bg-white rounded-lg p-4 shadow">
            <h2 class="text-lg font-medium mb-2">关于</h2>
            <p class="text-gray-600">版本 1.0.0</p>
        </div>
        <button 
                on:click={handleLogout}
                class="w-full py-2 px-4 bg-[#ff4400] text-white rounded-lg hover:bg-[#cc3600] transition-colors"
            >
                <strong>Logout</strong>
            </button>
    </div>
</div>