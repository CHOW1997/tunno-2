<script lang="ts">
    import { expenses } from '$lib/stores/expenseStore';
    import ExpenseItem from './ExpenseItem.svelte';
    
    export let selectedDate: string;
    
    $: filteredExpenses = $expenses.filter(expense => expense.date === selectedDate);
    $: todayTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
</script>
<div class="mb-4">
    <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 font-bold
        ">Today's Expenses</span>
        <span class="text-sm text-[#ff4400] font-bold">
            RM{todayTotal.toFixed(2)}
        </span>
    </div>
</div>
<div class="bg-white rounded-lg shadow mb-6">
    
    
    <div class="expense-list rounded-lg sm:px-4">
        {#if filteredExpenses.length === 0}
            <p class="text-gray-500 text-center py-4">No expenses yet</p>
        {:else}
            {#each filteredExpenses as expense}
                <ExpenseItem {expense} />
            {/each}
        {/if}
    </div>
</div>
