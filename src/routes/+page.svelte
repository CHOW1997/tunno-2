<script lang="ts">
    import { onMount } from 'svelte';
    import { expenses } from '$lib/stores/expenseStore';
    
    onMount(() => {
        expenses.init();
    });
</script>

