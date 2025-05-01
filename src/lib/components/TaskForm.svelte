<script lang="ts">
    import { tasks } from '$lib/stores/taskStore';
    import type { Task } from '$lib/stores/taskStore'; 
    export let selectedDate: string;
    let taskTitle = '';
    
    async function addTask() {
        if (taskTitle.trim()) {
            try {
                const newTask: Omit<Task, 'id'> = { // Specify type explicitly
                    user_id: '', // Add missing user_id property
                    title: taskTitle,
                    completed: false,
                    date: selectedDate,
                    remind_daily: false
                };
                console.log('正在添加任务:', newTask);
                await tasks.addTask(newTask);
                taskTitle = '';
                console.log('任务添加成功');
            } catch (error) {
                console.error('添加任务失败:', error);
            }
        }
    }
</script>

<!-- 保持原有 UI 不变 -->
<form class="task-form mb-6" on:submit|preventDefault={addTask}>
    <div class="flex gap-2">
        <div class="relative self-center flex-1">
            <input
                id="taskInput"
                type="text"
                bind:value={taskTitle}
                placeholder=" "
                class="peer w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <label 
                class="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-orange-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1" 
                for="taskInput"
            >
                Add Task
            </label>
        </div>
        
        <button
            type="submit"
            class="text-white px-4 py-1 rounded font-extrabold add-task"
        >
            &#43;
        </button>
    </div>
</form>

<style lang="postcss">
    .add-task {
        background-color: #ff4400;
        font-size: 1.5rem;
        &:hover {
            background-color: #ca5e17;
        }
    }
</style>
