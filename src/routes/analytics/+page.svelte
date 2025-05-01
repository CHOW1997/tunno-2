<script lang="ts">
    import { onMount } from 'svelte';
    import { expenses } from '$lib/stores/expenseStore';
    import { Chart, type ChartConfiguration } from 'chart.js/auto';
    import { tasks } from '$lib/stores/taskStore';
    
    let selectedPeriod: 'day' | 'week' | 'month' | 'year' = 'month';
let currentMonthOffset = 0;
    let selectedCategory: string = 'all';
    let totalExpense = 0;
    let averageExpense = 0;
    let canvas: HTMLCanvasElement;
    let chart: Chart;
    let taskCanvas: HTMLCanvasElement;
    let taskChart: Chart;
    let isShowingCategories = false;

    // Get unique categories from expenses
    $: categories = ['all', ...new Set($expenses.map(exp => exp.description))];

    $: {
        // 计算总支出和日均支出
        const currentDate = new Date();
if (selectedPeriod === 'year') {
    currentDate.setFullYear(new Date().getFullYear() + currentMonthOffset);
} else {
    currentDate.setMonth(new Date().getMonth() + currentMonthOffset);
}
currentDate.setDate(1); // 确保从每月第一天开始统计
currentDate.setHours(0, 0, 0, 0); // 重置时间为当天的开始
        const expenseData = $expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            if (selectedPeriod === 'day') {
                return expenseDate.toDateString() === currentDate.toDateString();
            } else if (selectedPeriod === 'week') {
                const weekStart = new Date(currentDate);
                weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                return expenseDate >= weekStart;
            } else if (selectedPeriod === 'month') {
                return expenseDate.getMonth() === currentDate.getMonth() &&
                       expenseDate.getFullYear() === currentDate.getFullYear();
            } else {
                return expenseDate.getFullYear() === currentDate.getFullYear();
            }
        });

        totalExpense = expenseData.reduce((sum, exp) => sum + exp.amount, 0);
        averageExpense = totalExpense / (selectedPeriod === 'day' ? 1 : 
                                       selectedPeriod === 'week' ? 7 : 
                                       selectedPeriod === 'month' ? 30 : 365);
    }

    // Separate reactive statement for chart updates
    $: if ((selectedPeriod || currentMonthOffset !== 0) && chart) {
        updateChart($expenses);
        updateTaskChart($tasks);
    }

    function updateChart(expenseData: any[]) {
        if (!chart) return;
        
        if (isShowingCategories) {
            // Category-based statistics
            const categoryData = expenseData.reduce((acc, exp) => {
                if (!acc[exp.description]) {
                    acc[exp.description] = 0;
                }
                acc[exp.description] += exp.amount;
                return acc;
            }, {} as Record<string, number>);

            chart.data.labels = Object.keys(categoryData);
            chart.data.datasets = [{
                label: 'Category Expenses',
                data: Object.values(categoryData),
                borderColor: '#ff4400',
                backgroundColor: 'rgba(255, 68, 0, 0.1)',
                borderWidth: 1
            }];
            
            chart.config.type = 'bar';
        } else {
            // Time series chart
            chart.config.type = 'line';
            const labels = [];
            const data = [];
            
            if (selectedPeriod === 'week') {
                // 周统计
                for (let i = 0; i < 7; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - date.getDay() + i);
                    labels.push(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]);
                    
                    const dayExpenses = expenseData.filter(exp => 
                        new Date(exp.date).toDateString() === date.toDateString()
                    );
                    data.push(dayExpenses.reduce((sum, exp) => sum + exp.amount, 0));
                }
            } else if (selectedPeriod === 'month') {
                // 月统计
                const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    labels.push(i.toString());
                    const dayExpenses = expenseData.filter(exp => 
                        new Date(exp.date).getDate() === i
                    );
                    data.push(dayExpenses.reduce((sum, exp) => sum + exp.amount, 0));
                }
            } else if (selectedPeriod === 'year') {
                // 年统计
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                for (let i = 0; i < 12; i++) {
                    labels.push(months[i]);
                    const monthExpenses = expenseData.filter(exp => 
                        new Date(exp.date).getMonth() === i
                    );
                    data.push(monthExpenses.reduce((sum, exp) => sum + exp.amount, 0));
                }
            } else {
                // 日统计（24小时）
                for (let i = 0; i < 24; i++) {
                    labels.push(`${i}:00`);
                    const hourExpenses = expenseData.filter(exp => 
                        new Date(exp.date).getHours() === i
                    );
                    data.push(hourExpenses.reduce((sum, exp) => sum + exp.amount, 0));
                }
            }

            chart.data.labels = labels;
            chart.data.datasets = [{
                label: '支出趋势',
                data: data,
                borderColor: '#ff4400',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(255, 68, 0, 0.1)'
            }];
        }
        
        chart.update('active');
    }

    onMount(() => {
        // Initialize expense chart
        const ctx = canvas.getContext('2d');
        chart = new Chart(ctx!, {
            type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Expense Trend',
            data: [],
            borderColor: '#f97316', // 更改为更柔和的橙色
            tension: 0.4, // 调整曲线平滑度
            fill: true,
            backgroundColor: (context) => {
                const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(249, 115, 22, 0.2)');
                gradient.addColorStop(1, 'rgba(249, 115, 22, 0.05)');
                return gradient;
            },
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2
        }]
    },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Initialize task chart
        const taskCtx = taskCanvas.getContext('2d');
        taskChart = new Chart(taskCtx!, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Completed Tasks',
                        data: [],
                        backgroundColor: 'rgba(34, 197, 94, 0.5)',
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 1
                    },
                    {
                        label: 'Pending Tasks',
                        data: [],
                        backgroundColor: 'rgba(249, 115, 22, 0.5)',
                        borderColor: 'rgb(249, 115, 22)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        // Initialize both charts
        updateChart($expenses);
        updateTaskChart($tasks);
    });
	
	let completedTasks = 0;
    let pendingTasks = 0;

    $: {
        const currentDate = new Date();
if (selectedPeriod === 'year') {
    currentDate.setFullYear(new Date().getFullYear() + currentMonthOffset);
} else {
    currentDate.setMonth(new Date().getMonth() + currentMonthOffset);
}
currentDate.setDate(1); // 确保从每月第一天开始统计
currentDate.setHours(0, 0, 0, 0); // 重置时间为当天的开始
        // 支出统计保持不变 ...

        // 任务统计
        const taskData = $tasks.filter(task => {
            const taskDate = new Date(task.date);
            if (selectedPeriod === 'day') {
                return taskDate.toDateString() === currentDate.toDateString();
            } else if (selectedPeriod === 'week') {
                const weekStart = new Date(currentDate);
                weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                return taskDate >= weekStart;
            } else if (selectedPeriod === 'month') {
                return taskDate.getMonth() === currentDate.getMonth() &&
                       taskDate.getFullYear() === currentDate.getFullYear();
            } else {
                return taskDate.getFullYear() === currentDate.getFullYear();
            }
        });

        completedTasks = taskData.filter(task => task.completed).length;
        pendingTasks = taskData.filter(task => !task.completed).length;
    }
	function updateTaskChart(taskData: any[]) {
        if (!taskChart) return;
        
        const labels = [];
        const completedData = [];
        const pendingData = [];
        
        if (selectedPeriod === 'week') {
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - date.getDay() + i);
                labels.push(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]);
                
                const dayTasks = taskData.filter(task => 
                    new Date(task.date).toDateString() === date.toDateString()
                );
                completedData.push(dayTasks.filter(task => task.completed).length);
                pendingData.push(dayTasks.filter(task => !task.completed).length);
            }
        } else if (selectedPeriod === 'month') {
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                labels.push(i.toString());
                const dayTasks = taskData.filter(task => 
                    new Date(task.date).getDate() === i
                );
                completedData.push(dayTasks.filter(task => task.completed).length);
                pendingData.push(dayTasks.filter(task => !task.completed).length);
            }
        } else if (selectedPeriod === 'year') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 0; i < 12; i++) {
                labels.push(months[i]);
                const monthTasks = taskData.filter(task => 
                    new Date(task.date).getMonth() === i
                );
                completedData.push(monthTasks.filter(task => task.completed).length);
                pendingData.push(monthTasks.filter(task => !task.completed).length);
            }
        } else {
            for (let i = 0; i < 24; i++) {
                labels.push(`${i}:00`);
                const hourTasks = taskData.filter(task => 
                    new Date(task.date).getHours() === i
                );
                completedData.push(hourTasks.filter(task => task.completed).length);
                pendingData.push(hourTasks.filter(task => !task.completed).length);
            }
        }

        taskChart.data.labels = labels;
        taskChart.data.datasets[0].data = completedData;
        taskChart.data.datasets[1].data = pendingData;
        taskChart.update();
    }

    // 修改现有的响应式语句
    $: if (selectedPeriod && taskChart) {
        updateTaskChart($tasks);
    }

    // 在现有的 onMount 后添加
    onMount(() => {
        // ... 现有的支出图表初始化保持不变 ...

        // 初始化任务图表
        const taskCtx = taskCanvas.getContext('2d');
        taskChart = new Chart(taskCtx!, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Completed Tasks',
                        data: [],
                        backgroundColor: 'rgba(34, 197, 94, 0.5)',
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 1
                    },
                    {
                        label: 'Pending Tasks',
                        data: [],
                        backgroundColor: 'rgba(249, 115, 22, 0.5)',
                        borderColor: 'rgb(249, 115, 22)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        updateTaskChart($tasks);
    });
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="space-y-6 p-4">
    <!-- Current month display -->
    
    <!-- Category selection -->
    

    <!-- Time range selection -->
    <div class="flex gap-2 justify-evenly">

        <button 
            class="px-4 py-2 rounded-lg {selectedPeriod === 'day' ? 'bg-[#ff4400] text-white' : 'bg-gray-100'}"
            on:click={() => selectedPeriod = 'day'}
        >
            Day
        </button>
        <button 
            class="px-4 py-2 rounded-lg {selectedPeriod === 'week' ? 'bg-[#ff4400] text-white' : 'bg-gray-100'}"
            on:click={() => selectedPeriod = 'week'}
        >
            Week
        </button>
        <button 
            class="px-4 py-2 rounded-lg {selectedPeriod === 'month' ? 'bg-[#ff4400] text-white' : 'bg-gray-100'}"
            on:click={() => selectedPeriod = 'month'}
        >
            Month
        </button>
        <button 
            class="px-4 py-2 rounded-lg {selectedPeriod === 'year' ? 'bg-[#ff4400] text-white' : 'bg-gray-100'}"
            on:click={() => selectedPeriod = 'year'}
        >
            Year
        </button>
        
    </div>

    <!-- Chart type toggle button -->
    <div class="flex justify-end">
        
    </div>

    <!-- Statistics cards -->
    <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b flex justify-between items-center ">
            <h3 class="text-lg font-semibold">Monthly Statistics</h3>
            
            {#if selectedPeriod === 'month' || selectedPeriod === 'year'}
                <div class="text-center flex text-xl font-semibold mb-4">
                    <button 
                    class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    on:click={() => { currentMonthOffset -= 1; }}
                    >
                    &lt;
                    </button>
                    <h2 class="text-xl font-bold content-center px-3">
                        {selectedPeriod === 'month' 
                            ? new Date(new Date().setMonth(new Date().getMonth() + currentMonthOffset)).toLocaleString('default', { month: 'long', year: 'numeric' })
                            : new Date(new Date().setFullYear(new Date().getFullYear() + currentMonthOffset)).getFullYear()}
                    </h2>
                    <button 
                    class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    on:click={() => { currentMonthOffset += 1; }}
                    >
                    &gt;
                    </button>
                </div>
            {/if}
            
            <button 
            class="px-4 py-2 rounded-lg bg-[#ff4400] text-white"
            on:click={() => {
                isShowingCategories = !isShowingCategories;
                updateChart($expenses);
            }}
        >
            {isShowingCategories ? 'line' : 'item'}
        </button>
        </div>
        <div class="p-4 grid grid-cols-2 gap-4">
            <div>
                <p class="text-sm text-gray-500">Total Expenses</p>
                <p class="text-xl font-bold">RM{totalExpense.toFixed(2)}</p>
            </div>
            <div>
                <p class="text-sm text-gray-500">Daily Average</p>
                <p class="text-xl font-bold">RM{averageExpense.toFixed(2)}</p>
            </div>
            <canvas bind:this={canvas} class="col-span-2"></canvas>
        </div>
        
    </div>

    <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b">
            <h3 class="text-lg font-semibold">Task Statistics</h3>
        </div>
        <div class="p-4 grid grid-cols-2 gap-4">
            <div>
                <p class="text-sm text-gray-500">Completed Tasks</p>
                <p class="text-xl font-bold text-green-600">{completedTasks}</p>
            </div>
            <div>
                <p class="text-sm text-gray-500">Pending Tasks</p>
                <p class="text-xl font-bold text-orange-600">{pendingTasks}</p>
            </div>
            <canvas bind:this={taskCanvas} class="col-span-2"></canvas>
        </div>
    </div>
</div>







