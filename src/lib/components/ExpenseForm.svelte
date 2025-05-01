<script lang="ts">
    import { supabase } from '$lib/supabaseClient';
    import { expenses } from '$lib/stores/expenseStore';
    export let selectedDate: string;    
    let amount = '';
    let description = '';
    let isSubmitting = false;
    
    async function handleSubmit(event: Event) {
        event.preventDefault();
        
        if (!description.trim() || isNaN(parseFloat(amount))) {
            alert('请输入有效的描述和金额');
            return;
        }
        
        try {
            isSubmitting = true;
            await expenses.add({
                amount: parseFloat(amount),
                description: description.trim(),
                date: selectedDate,
                user_id: (await supabase.auth.getUser()).data.user?.id ?? ''
            });
            
            // 重置表单
            amount = '';
            description = '';
        } catch (error) {
            alert('添加支出失败，请稍后重试');
            console.error(error);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<form class="flex gap-3" on:submit={handleSubmit}>
    <input 
        type="text" 
        bind:value={description}
        placeholder="Description" 
        class="w-full sm:flex-1 p-2 border border-gray-300 rounded-lg"
        disabled={isSubmitting}
    />
    <input 
        type="number" 
        bind:value={amount}
        step="0.01"
        min="0"
        placeholder="RM" 
        class="w-full sm:w-32 p-2 border border-gray-300 rounded-lg text-lg"
        disabled={isSubmitting}
    />
    
    <button 
        type="submit" 
        class="sm:w-auto bg-[#ff4400] text-white px-4 py-2 sm:py-1 rounded font-extrabold disabled:opacity-50"
        disabled={isSubmitting}
    >
        {#if isSubmitting}
            ...
        {:else}
            &#43;
        {/if}
    </button>
</form>