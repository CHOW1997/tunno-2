<script lang="ts">

    import { format, addDays, endOfMonth, startOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths } from 'date-fns';    import {  } from 'date-fns';
    import { spring } from 'svelte/motion';
    import { createEventDispatcher } from 'svelte';
	import Button from '@smui/button';
    const dispatch = createEventDispatcher(); 
    let currentDate = new Date(new Date().setHours(0,0,0,0));
    let minDate = startOfMonth(currentDate);
    let maxDate = endOfMonth(currentDate);
    
    // 监听当前日期变化，动态更新可选范围
    $: {
        minDate = startOfMonth(currentDate);
        maxDate = endOfMonth(currentDate);
    }
    let isMonthView = false;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

  
    function toggleView() {
      isMonthView = !isMonthView;
    }
  
    function handleStart(clientX: number) {
      startX = clientX;
      isDragging = true;
    }
    
    // 添加新的动画状态
    const scale = spring(1, {
        stiffness: 0.1,
        damping: 0.65
    });
    const opacity = spring(1, {
        stiffness: 0.1,
        damping: 0.65
    });
    const position = spring(0, {
        stiffness: 0.1,  // 降低刚度使动画更柔和
        damping: 0.65    // 增加阻尼使动画更顺滑
    });

    function handleMove(clientX: number) {
        if (!isDragging) return;
    currentX = clientX - startX;
    const maxDrag = 100; // 减小拖动距离，使操作更灵敏
    const boundedX = Math.max(Math.min(currentX, maxDrag), -maxDrag);
    const progress = Math.abs(boundedX) / maxDrag;
    
    // 优化日期切换逻辑
    const newIndex = Math.round(boundedX / 50); // 减小切换阈值
    if (newIndex !== activeIndex) {
        const newDate = addDays(currentDate, -newIndex);
        currentDate = newDate; // 移除范围检查，让切换更流畅
        activeIndex = newIndex;
    }
    
    // 优化动画效果
    position.set(boundedX, {
        stiffness: 0.2,
        damping: 0.7
    });
    
    // 减小缩放和透明度变化，保持更好的可读性
    scale.set(1 - progress * 0.03);
    opacity.set(1 - progress * 0.1);
    }
    
  
    function handleTouchStart(event: TouchEvent) {
      handleStart(event.touches[0].clientX);
    }
  
    function handleTouchMove(event: TouchEvent) {
      handleMove(event.touches[0].clientX);
    }
  
    function handleEnd() {
        isDragging = false;
        // 添加弹性回弹效果
        position.set(0, {
            hard: false,
            stiffness: 0.3,
            damping: 0.8
        });
        scale.set(1, { stiffness: 0.3 });
        opacity.set(1, { stiffness: 0.3 });
        currentX = 0;
        activeIndex = 0;
    }
    function handleWheel(event: WheelEvent) {
        event.preventDefault();
        const direction = event.deltaY > 0 ? 1 : -1;
        changeDate(direction);
    }
    function changeMonth(direction: number) {
        currentDate = addMonths(currentDate, direction);
    }
    function handleMouseDown(e: MouseEvent) {
      handleStart(e.clientX);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    function handleMouseMove(e: MouseEvent) {
      handleMove(e.clientX);
    }
    
    function handleMouseUp() {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      handleEnd();
    }
  
    function changeDate(direction: number) {
        const newDate = addDays(currentDate, direction);
        // 如果超出当月范围，自动调整到下个月
        if (newDate > maxDate) {
            currentDate = addDays(maxDate, 1);
        } else if (newDate < minDate) {
            currentDate = addDays(minDate, -1);
        } else {
            currentDate = newDate;
        }
    }
  
    function goToToday() {
      currentDate = new Date(new Date().setHours(0,0,0,0));
    }
  
    $: activeIndex = Math.round(currentX / 100);

    function handleDateClick(offset: number) {
        changeDate(offset);
        dispatch('dateSelect', { date: format(currentDate, 'yyyy-MM-dd') ,action: 'select'},);
    }
    $: monthDays = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    $: calendarDays = (() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    })();

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


    // 月视图中的日期点击也需要触发事件
    function handleMonthDateClick(day: Date) {
        currentDate = day;
        isMonthView = false;
        dispatch('dateSelect', { date: format(day, 'yyyy-MM-dd') });
    }
  </script>


<div class="calendar">
    <div class="header">
        <div class="year-month flex">
            <span class="flex-1">{format(currentDate, 'yyyy')}</span>
            <span class="flex-1">{format(currentDate, 'MMMM')}</span>
        </div>
        <div class="navigation">
            <button on:click={() => isMonthView ? changeMonth(-1) : changeDate(-1)}>←</button>
            <button on:click={goToToday}>Today</button>
            <button on:click={() => isMonthView ? changeMonth(1) : changeDate(1)}>→</button>
            <button class="view-toggle" on:click={toggleView} aria-label="Toggle calendar view">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zm-12 6h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zm-12 6h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" fill="currentColor"/>
                </svg>
            </button>
        </div>
    </div>
    <div class="calendar">
        <!-- ... existing template ... -->
        {#if isMonthView}
            <div class="month-view">
                <div class="weekdays">
                    {#each weekDays as day}
                        <div class="weekday">{day}</div>
                    {/each}
                </div>
                <div class="month-grid">
                    {#each calendarDays as day}
                        <div 
                            class="month-day"
                            class:other-month={day.getMonth() !== currentDate.getMonth()}
                            on:keydown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleMonthDateClick(day);
                                }
                            }}
                            role="button"
                            tabindex="0"
                            class:today={format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
                            on:click={() => handleMonthDateClick(day)}
                        >
                            {format(day, 'd')}
                        </div>
                    {/each}
                </div>
            </div>
        {:else}
        <div class="dates-container">
            <div class="dates"
                on:touchstart|passive={handleTouchStart}
                role="button"
                tabindex="0"
                on:touchmove|passive={handleTouchMove}
                on:touchend={handleEnd}
                on:mousedown={handleMouseDown}
                on:wheel|preventDefault={handleWheel}
                style="transform: translateX({$position}px) scale({$scale}); opacity: {$opacity}">
                {#each [-2, -1, 0, 1, 2] as offset}
                    <button type="button" class="date-item"
                        tabindex="0"
                        on:click={() => handleDateClick(offset)}
                        class:active={offset === -activeIndex}
                        class:past={addDays(currentDate, offset) < new Date(new Date().setHours(0,0,0,0))}
                        class:future={addDays(currentDate, offset) > new Date(new Date().setHours(23,59,59,999))}>
                        <div class="day">{format(addDays(currentDate, offset), 'd')}</div>
                        <div class="month">{format(addDays(currentDate, offset), 'MMM')}</div>
                    </button>
                {/each}
                </div>
        </div>
        {/if}
    </div>
    
</div>

<style lang="postcss">
    .calendar {
        width: 100%;
        max-width: 600px;
        margin: 1rem auto;
        padding: 0rem 1rem;
    }
    
    .header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    
    .navigation {
        display: flex;
        gap: 0.5rem;
        width: 100%;
        justify-content: center;
    }

    .navigation button {
        padding: 0.5rem 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: white;
        color: #333;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: #f5f5f5;
        }
    }

    .dates-container {
        overflow: hidden;
        margin: 0 -1rem;
        padding: 1rem 1rem;
    }
    
    .dates {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        padding: 0;
    }
    
    .date-item {
        border: 1px solid #e0e0e0;
        background-color: #ffffff;
        flex: 0 0 80px;
        text-align: center;
        padding: 1rem 0.5rem;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease-out;
        
        .day {
            font-size: 1.5rem;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }
        
        .month {
            font-size: 0.875rem;
            opacity: 0.8;
        }
        
        &:hover {
            background-color: #000000;
            color: #ffffff;
            .day {
                font-weight: 600;
            }
            .month {
                font-weight: 600; 
            }
        }
        
        &.active {
           
            .day {
                font-weight: 600;
                font-size: 2rem;
            }
            .month {
                font-weight: 600; 
            }
            box-shadow: 0rem 0rem 0.8rem #ff4400;
            background-color: #ff4400;
            color: #ffffff;
            transform: scale(1.05);
            border: none;
            
        }

        &.past {
            color: #999;
        }
    }
    .month-view {
        width: 100%;
        border-radius: 12px;
        background: white;
        padding: 1rem;
    }

    .weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        font-weight: 500;
        margin-bottom: 1rem;
        color: #666;
    }

    .month-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
    }

    .month-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 50%;
        transition: all 0.2s;

        &:hover {
            background: #f5f5f5;
        }

        &.other-month {
            color: #ccc;
        }

        &.today {
            background: #ff4400;
            color: white;
            font-weight: 600;
        }
    }
    .year-month {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 0.5rem;
        
        span:first-child {
            font-size: 1.5rem;
            font-weight: 500;
            color: #333;
        }
        
        span:last-child {
            font-size: 1.2rem;
            color: #666;
            text-align: right;
        }
    }
</style>
