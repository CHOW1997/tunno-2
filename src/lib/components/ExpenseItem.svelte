<script lang="ts">
    import { expenses, type Expense } from '$lib/stores/expenseStore';
    
    export let expense: Expense;
    let isEditing = false;
    let editAmount = expense.amount.toString();
    let editDescription = expense.description;
    let showDropdown = false;

    function handleEdit() {
        expenses.update(expenses => expenses.map(e => 
            e.id === expense.id ? { 
                ...e,  // 正确格式化的对象展开
                amount: parseFloat(editAmount),
                description: editDescription
            } : e  // 添加缺失的三元运算符备选条件
        ));  // 修复括号闭合和使用英文分号
        
        isEditing = false;
    }

    function handleDelete() {
        if (confirm('确定要删除这条记录吗？')) {
            expenses.delete(expense.id);
        }
    }
</script>

<div class="p-4 flex items-center justify-between hover:bg-gray-50 relative">
    {#if isEditing}
        <div class="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 w-full">
            <div class="flex space-x-2 flex-1">
                <input 
                    type="text"
                    bind:value={editDescription}
                    class="flex-1 p-2 rounded-lg border border-gray-400"
                />
                <input 
                    type="number"
                    bind:value={editAmount}
                    class="w-24 p-2 border border-gray-400 rounded-lg"
                />
                
            </div>
            <div class="flex space-x-2">
                <button 
                    on:click={handleEdit}
                    class="px-4 py-2  bg-[#ff4400] text-white rounded-lg"
                >
                    Save
                </button>
                <button 
                    on:click={() => isEditing = false}
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                >
                    Cancel
                </button>
            </div>
        </div>
    {:else}
        <div class="flex items-center gap-4">
            <div>
                <p class="font-medium text-gray-500"><strong>{expense.description}</strong></p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <p class="font-medium text-gray-500">RM{expense.amount.toFixed(2)}</p>
            <button 
                class="p-1 hover:bg-gray-100 rounded"
                on:click={() => showDropdown = !showDropdown}
            >
                ⋮
            </button>
            {#if showDropdown}
                <div
                    role="menu"
                    tabindex="0"
                    class="absolute right-4 top-12 bg-white shadow-lg rounded-lg py-2 z-10"
                    on:mouseleave={() => showDropdown = false}
                >
                    <button 
                        class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        on:click={() => {
                            isEditing = true;
                            showDropdown = false;
                        }}
                    >
                        Edit
                    </button>
                    <button 
                        class="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500 flex items-center gap-2"
                        on:click={() => {
                            handleDelete();
                            showDropdown = false;
                        }}
                    >
                        delete
                    </button>
                </div>
            {/if}
        </div>
    {/if}
</div>