<script lang="ts">
    import { page } from '$app/stores';
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2">
    <div class="max-w-screen-xl mx-auto px-4">
        <div class="flex justify-around items-center">
            <a href="/analytics" class="flex flex-col items-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" 
                    class="h-6 w-6 {$page.url.pathname === '/analytics' ? 'text-[#ff4400]' : 'text-gray-400'}" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span class="text-xs mt-1 {$page.url.pathname === '/analytics' ? 'text-[#ff4400]' : 'text-gray-400'}">Analytics</span>
            </a>

            <a href="/expenses" class="flex flex-col items-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" 
                    class="h-6 w-6 {$page.url.pathname === '/expenses' ? 'text-[#ff4400]' : 'text-gray-400'}" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-xs mt-1 {$page.url.pathname === '/expenses' ? 'text-[#ff4400]' : 'text-gray-400'}">Expenses</span>
            </a>
            <a href="/tasks" class="flex flex-col items-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" 
                    class="h-6 w-6 {$page.url.pathname === '/tasks' ? 'text-[#ff4400]' : 'text-gray-400'}" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span class="text-xs mt-1 {$page.url.pathname === '/tasks' ? 'text-[#ff4400]' : 'text-gray-400'}">To-do</span>
            </a>

            <a href="/settings" class="flex flex-col items-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" 
                    class="h-6 w-6 {$page.url.pathname === '/settings' ? 'text-[#ff4400]' : 'text-gray-400'}" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="text-xs mt-1 {$page.url.pathname === '/settings' ? 'text-[#ff4400]' : 'text-gray-400'}">Setting</span>
            </a>
        </div>
    </div>
</nav>

<div class="pb-20">
    <slot />
</div>