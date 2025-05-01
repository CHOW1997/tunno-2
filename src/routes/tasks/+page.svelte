<script lang="ts">
	import TaskForm from '$lib/components/TaskForm.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	let selectedDate = new Date().toISOString().split('T')[0]; // 默认为今天
    import { onMount } from 'svelte';
    import { tasks } from '$lib/stores/taskStore';
    
    onMount(() => {
        tasks.init();
    });
	
    function handleDateSelect(event: CustomEvent) {
        selectedDate = event.detail.date;
    }
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<Calendar on:dateSelect={handleDateSelect} />
    <TaskForm {selectedDate} />
    <TaskList {selectedDate} />
</section>

<style>
	

	
</style>

