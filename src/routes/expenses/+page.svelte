<script lang="ts">
    import { onMount } from 'svelte';
    import { expenses } from '$lib/stores/expenseStore';
    
    onMount(() => {
        expenses.init();
    });
    import ExpenseForm from '$lib/components/ExpenseForm.svelte';
    import ExpenseList from '$lib/components/ExpenseList.svelte';
    import Calendar from '$lib/components/Calendar.svelte';
    import { format } from 'date-fns';

    let selectedDate = format(new Date(), 'yyyy-MM-dd');

    function handleDateSelect(event: CustomEvent) {
        selectedDate = event.detail.date;
    }
</script>

<div>
    
    <Calendar on:dateSelect={handleDateSelect} />
    <div class="mb-6">
        <ExpenseForm {selectedDate} />
    </div>
    <ExpenseList {selectedDate} />  
</div>


