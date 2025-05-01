<script lang="ts">

    import { onMount } from 'svelte';
    import { user } from '$lib/stores/authStore'; // Add this import

    import { tasks, type Task } from '$lib/stores/taskStore';
    import Calendar from '$lib/components/Calendar.svelte';
    onMount(async () => {
        try {
            await tasks.init();
            // 任务初始化完成
        } catch (error) {
            console.error('初始化任务失败:', error);
        }
    });
    
    let editingId: string | null = null;
    let editingTitle: string = '';
    export let selectedDate: string;
    
    function getSubtasksProgress(subtasks: Task[]): number {
        if (!subtasks || subtasks.length === 0) return 0;
        const completedCount = subtasks.filter(task => task.completed).length;
        return Math.round((completedCount / subtasks.length) * 100);
    }
    
    async function toggleTask(taskId: string) {
        // 先在主任务中查找
        let task = $tasks.find(t => t.id === taskId);
        let isSubtask = false;

        // 如果在主任务中没找到，就在子任务中查找
        if (!task) {
            for (const mainTask of $tasks) {
                const subtask = mainTask.subtasks?.find(st => st.id === taskId);
                if (subtask) {
                    task = subtask;
                    isSubtask = true;
                    break;
                }
            }
        }

        if (!task) return;

        try {
            if (isSubtask) {
                // 如果是子任务
                const newCompleted = !task.completed;
                const parentTask = $tasks.find(t => t.subtasks?.some(st => st.id === taskId));
                
                if (!parentTask) return;

                await tasks.updateSubtask(taskId, parentTask.id, { 
                    completed: newCompleted 
                });

                // 检查所有子任务的完成状态
                const allCompleted = parentTask.subtasks?.every(st => 
                    st.id === taskId ? newCompleted : st.completed
                );
                
                // 更新父任务状态
                await tasks.updateTask(parentTask.id, { 
                    completed: allCompleted 
                });
            } else {
                // 如果是主任务
                const newCompleted = !task.completed;
                await tasks.updateTask(taskId, { 
                    completed: newCompleted 
                });

                // 更新所有子任务状态
                const subtasks = task.subtasks || [];
                if (subtasks.length > 0) {
                    await Promise.all(
                        subtasks.map(subtask => 
                            tasks.updateSubtask(subtask.id, task.id, { 
                                completed: newCompleted 
                            })
                        )
                    );
                }
            }
        } catch (error) {
            console.error('更新任务状态失败:', error);
        }
    }

    function deleteTask(taskId: string) {
        let task = $tasks.find(t => t.id === taskId);
        if (!task) {
            // 如果在主任务中没找到，就在所有子任务中查找
            task = $tasks.flatMap(t => t.subtasks || []).find(st => st.id === taskId);
        }
        
        if (task) {
            if (task.parent_id && confirm('Do you want to delete subtask?')) {
                // 如果是子任务
                tasks.deleteSubtask(taskId, task.parent_id);
            } else if(confirm('Do you want to delete task?')){
                // 如果是主任务
                tasks.deleteTask(taskId);
            }
        }
    }

    // 删除重复的函数定义，只保留这个异步版本
    async function addSubtask(parentId: string) {
        await tasks.addSubtask(parentId, {
            title: "New subtask",
            completed: false,
            parent_id: parentId,
            date: selectedDate,
            remind_daily: false,
            user_id: $user?.id || '', // 添加 user_id
        });
        
        // 确保父任务展开并触发更新
        expandedTasks.add(parentId);
        expandedTasks = expandedTasks;
    }

    // 删除重复的函数定义，只保留这个异步版本
    async function saveEdit() {
        if (editingId) {
            // Find task in both main tasks and subtasks
            let task = $tasks.find(t => t.id === editingId);
            if (!task) {
                // If not found in main tasks, search in subtasks
                task = $tasks.flatMap(t => t.subtasks || []).find(st => st.id === editingId);
            }
            if (task) {
                if (task.parent_id) {
                    try {
                        await tasks.updateSubtask(editingId, task.parent_id, { 
                            title: editingTitle
                        });
                    } catch (error) {
                        console.error('更新子任务失败:', error);
                    }
                } else {
                    await tasks.updateTask(editingId, { title: editingTitle });
                }
            }
            editingId = null;
            editingTitle = '';
        }
    }

    

    // 删除重复的函数定义，只保留这个异步版本
    async function toggleReminder(taskId: string) {
        const task = $tasks.find(t => t.id === taskId);
        if (task) {
            await tasks.updateTask(taskId, { 
                    remind_daily: !task.remind_daily 
                });
        }
    }

    // 删除重复的函数定义，只保留这个异步版本
    async function moveTaskToDate(taskId: string, newDate: string) {
        const task = $tasks.find(t => t.id === taskId);
        if (task) {
            if (task.parent_id) {
                await tasks.updateSubtask(taskId, task.parent_id, { date: newDate });
            } else {
                await tasks.updateTask(taskId, { date: newDate });
            }
        }
    }

    // 删除重复的函数定义，只保留这个异步版本
    async function duplicateTaskToDate(taskId: string, newDate: string) {
        const task = $tasks.find(t => t.id === taskId);
        if (!task) return;

        // 创建新的主任务
        const newTask = {
            title: task.title,
            completed: false,  // 新任务默认未完成
            date: newDate,
            remind_daily: task.remind_daily,
            user_id: $user?.id || '' // 添加用户 ID
        };

        // 如果原任务有子任务，复制所有子任务
        if (task.subtasks && task.subtasks.length > 0) {
            const newTaskId = await tasks.addTask(newTask);
            
            // 为新任务添加所有子任务
            for (const subtask of task.subtasks) {
                await tasks.addSubtask(newTaskId, {
                    title: subtask.title,
                    user_id: $user?.id || '', // Add user_id from the store with empty string fallbackZ
                    completed: false,  // 子任务也默认未完成
                    parent_id: newTaskId,
                    date:selectedDate,
                    remind_daily: subtask.remind_daily
                });
            }
        } else {
            // 如果没有子任务，直接添加主任务
            await tasks.addTask(newTask);
        }
    }

    function startEdit(task: Task) {
        console.log('Starting edit for task:', task); // Debug log
        editingId = task.id;
        editingTitle = task.title;
    }

    

    function cancelEdit() {
        editingId = null;
        editingTitle = '';
    }


   

    let openDropdownId: string | null = null;

    function toggleDropdown(taskId: string) {
        openDropdownId = openDropdownId === taskId ? null : taskId;
    }

    let expandedTasks: Set<string> = new Set();

    function toggleExpand(taskId: string) {
        if (expandedTasks.has(taskId)) {
            expandedTasks.delete(taskId);
        } else {
            expandedTasks.add(taskId);
        }
        expandedTasks = expandedTasks; // 触发更新
    }
    function getTodayTasksProgress(): { completed: number, total: number } {
        // 获取主任务和子任务的完成情况
        const mainTasks = filteredTasks;
        const completedCount = mainTasks.filter(task => task.completed).length;
        return {
            completed: completedCount,
            total: mainTasks.length
        };
    }
    

    
    let showDatePicker = false;
    let datePickerAction: { taskId: string; type: 'move' | 'duplicate' } | null = null;

    function openDatePicker(taskId: string, type: 'move' | 'duplicate') {
        datePickerAction = { taskId, type };
        showDatePicker = true;
        toggleDropdown(taskId);
    }

    function handleDateSelect(event: CustomEvent) {
        if (datePickerAction) {
            const newDate = event.detail.date;
            if (datePickerAction.type === 'move') {
                moveTaskToDate(datePickerAction.taskId, newDate);
            } else {
                duplicateTaskToDate(datePickerAction.taskId, newDate);
            }
            showDatePicker = false;
            datePickerAction = null;
        }
    }
    
    $: filteredTasks = $tasks.filter(task => {
    // 只筛选主任务
    const isMainTask = task.date === selectedDate && 
                     task.user_id === $user?.id &&
                     !task.parent_id;
    
    if (isMainTask) {
        // 动态查找所有属于该主任务的子任务
        const subtasks = $tasks.filter(t => 
            t.parent_id === task.id && 
            t.user_id === $user?.id &&
            t.date === selectedDate
        );
        
        return {
            ...task,
            subtasks: subtasks
        };
    }
    return false;
}).filter(Boolean);


</script>
<div class="mb-4">
    <div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
            class="h-full bg-[#ff4400] transition-all duration-300" 
            style="width: {getTodayTasksProgress().total === 0 ? 0 : (getTodayTasksProgress().completed / getTodayTasksProgress().total * 100)}%"
        ></div>
    </div>
    <div class="flex items-center justify-between mt-2">
        <span class="text-sm text-gray-600">Today's Tasks</span>
        <span class="text-sm font-medium text-[#ff4400]">
            {getTodayTasksProgress().completed}/{getTodayTasksProgress().total}
        </span>
    </div>
</div>

<div class="task-list rounded-lg sm:px-4">
    

    
    {#if $tasks.length === 0}
        <p class="text-gray-500 text-center py-4">No tasks yet</p>
    {:else if filteredTasks.length === 0}
        <p class="text-gray-500 text-center py-4">当前日期没有任务</p>
    {:else}
        {#each filteredTasks as task}
            <div class="task-group mb-6">
                <div class="flex items-center gap-3">
                    <button 
                        class="w-6 h-6 flex items-center justify-center text-gray-500"
                        on:click={() => toggleExpand(task.id)}
>
                        {#if task.subtasks && task.subtasks.length > 0}
                            {#if expandedTasks.has(task.id)}
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M5 8l5 5 5-5z"/>
                                </svg>
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 6l5 5-5 5v-10z"/>
                                </svg>
                            {/if}
                        {/if}
                    </button>
                    
                    <input
                        type="checkbox"
                        checked={task.completed}
                        on:change={() => toggleTask(task.id)}
                        class="align-top w-5 h-5 rounded border-gray-300 text-[#ff4400] focus:ring-[#000000]"
                    />
                    
                    {#if editingId === task.id}
                        <div class="flex gap-2 items-center flex-1">
                            <input
                                type="text"
                                bind:value={editingTitle}
                                class="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff4400] focus:border-[#ff4400]"
                            />
                            
                            <div class="flex gap-2">
                                <button 
                                    class="px-3 py-1 bg-[#ff4400] text-white rounded-md hover:bg-[#ca3803]"
                                    on:click={saveEdit}
                                >
                                    保存
                                </button>
                                <button 
                                    class="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    on:click={cancelEdit}
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="flex-1 flex items-center justify-between">
                            <div class="flex flex-col gap-2 mr-5 w-full">
                                <span class="text-gray-700 text-lg {task.completed ? 'line-through text-gray-400' : ''}">
                                    {task.title}
                                </span>
                                
                                {#if task.subtasks && task.subtasks.length > 0}
                                    <div class="flex w-full md:w-auto items-center gap-2">
                                        <div class="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                class="h-full bg-[#ff4400] transition-all duration-300" 
                                                style="width: {getSubtasksProgress(task.subtasks)}%"
                                            ></div>
                                        </div>
                                        <span class="text-sm text-gray-500 whitespace-nowrap">
                                            {getSubtasksProgress(task.subtasks)}%
                                            ({task.subtasks.length} {task.subtasks.length > 1 ? 'subtasks' : 'subtask'})
                                        </span>
                                    </div>
                                    {:else}
                                    <span class="text-sm text-gray-500 whitespace-nowrap">
                                        [ no subtask at the moment ]
                                    </span>
                                {/if}
                            </div>
                            
                            <div class="flex items-center gap-2">
                                <!-- svelte-ignore a11y_consider_explicit_label -->
                                <button 
                                    class= " border border-gray-200 flex items-center gap-1 px-2 py-1.5 text-gray-500 hover:text-[#ff4400] rounded hover:bg-gray-100 transition-colors"
                                    title="添加子任务"
                                    on:click={() => {
                                        addSubtask(task.id);
                                        expandedTasks.add(task.id);
                                        expandedTasks = expandedTasks;
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                                
                                <div class="relative">
                                    <button 
                                        class="text-gray-500 hover:text-gray-700"
                                        on:click|stopPropagation={() => toggleDropdown(task.id)}
                                    >
                                        •••
                                    </button>
                                    {#if openDropdownId === task.id}
                                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border">
                                            <button 
                                                class="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                                                on:click={() => {
                                                    startEdit(task);
                                                    toggleDropdown(task.id);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                                                on:click={() => {
                                                    deleteTask(task.id);
                                                    toggleDropdown(task.id);
                                                }}
                                            >
                                                Delete
                                            </button>
                                            <label class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                <input
                                                    type="checkbox"
                                                    checked={task.remind_daily}
                                                    on:change={() => {
                                                        toggleReminder(task.id);
                                                        toggleDropdown(task.id);
                                                    }}
                                                    class="mr-2 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                Remind
                                            </label>
                                            <button 
                                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                on:click={() => openDatePicker(task.id, 'move')}
                                            >
                                                Move to...
                                            </button>
                                            <button 
                                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                on:click={() => openDatePicker(task.id, 'duplicate')}
                                            >
                                                Copy to...
                                            </button>

                                            <!-- 在组件最后添加日期选择器模态框 -->
                                            
                                        </div>
                                    {/if}
                                </div>
                                {#if showDatePicker}
                                    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                        <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                                            <div class="flex justify-between items-center mb-4">
                                                <h3 class="text-lg font-medium">
                                                    {datePickerAction?.type === 'move' ? '移动到日期' : '复制到日期'}
                                                </h3>
                                                <button 
                                                    class="text-gray-400 hover:text-gray-600"
                                                    on:click={() => {
                                                        showDatePicker = false;
                                                        datePickerAction = null;
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <Calendar on:dateSelect={handleDateSelect} />
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                   
                </div>

                {#if expandedTasks.has(task.id) && task.subtasks && task.subtasks.length > 0}
                    <div class="ml-8 pl-4 border-l border-gray-200 mt-2">
                        {#each task.subtasks as subtask}
                            <div class="task-item mb-2">
                                <div class="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={subtask.completed}
                                        on:change={() => toggleTask(subtask.id)}
                                        class="w-4 h-4 rounded border-gray-300 text-[#ff4400] focus:ring-[#ff4400]"
                                    />
                                    {#if editingId === subtask.id}
                                        <div class="flex gap-2 items-center flex-1">
                                            <input
                                                type="text"
                                                bind:value={editingTitle}
                                                class="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff4400] focus:border-[#ff4400]"
                                            />
                                            <div class="flex gap-2">
                                                <button 
                                                    class="px-3 py-1 bg-[#ff4400] text-white rounded-md hover:bg-[#ca3803]"
                                                    on:click={saveEdit}
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    class="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                                    on:click={cancelEdit}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    {:else}
                                        <div class="flex-1 flex items-center justify-between">
                                            <span class="text-gray-600 {subtask.completed ? 'line-through text-gray-400' : ''}">
                                                {subtask.title}
                                            </span>
                                            <div class="relative">
                                                <button 
                                                    class="text-gray-500 hover:text-gray-700"
                                                    on:click|stopPropagation={() => toggleDropdown(subtask.id)}
                                                >
                                                    •••
                                                </button>
                                                {#if openDropdownId === subtask.id}
                                                    <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border">
                                                        <button 
                                                            class="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                                                            on:click={() => {
                                                                startEdit(subtask);
                                                                toggleDropdown(subtask.id);
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                                                            on:click={() => {
                                                                deleteTask(subtask.id);
                                                                toggleDropdown(subtask.id);
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}
    {/if}

    <div class="task-list">
        <!-- 添加这个调试区域 -->
        {#if import.meta.env.DEV}
            <div class="debug-info" style="background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px;">
                <p>选中日期: {selectedDate}</p>
                <p>任务总数: {$tasks.length}</p>
                <p>当前日期任务数: {$tasks.filter(task => task.date === selectedDate).length}</p>
            </div>
        {/if}
        
        <!-- 原有的任务列表代码 -->
    </div>
   
</div>


<svelte:window on:click={() => openDropdownId = null}/>
