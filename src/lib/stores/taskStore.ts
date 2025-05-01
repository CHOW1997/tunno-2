import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';

export type Task = {
    id: string;
    user_id: string; // 添加用户ID字段
    title: string;
    completed: boolean;
    date: string;
    remind_daily: boolean;
    parent_id?: string;  // 添加这个可选属性
    subtasks?: Task[];
};

// 添加连接检查函数


function createTaskStore() {
    const { subscribe, set, update } = writable<Task[]>([]);
    // 添加状态管理
    let initialized = false;
    let currentUser: string | null = null;
    let syncTimeout: NodeJS.Timeout;
    let currentSession: { user: { id: string } } | null = null;  // 添加会话存储
    async function ensureSession() {
        try {
            if (currentSession) return currentSession;
            
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                currentSession = session;
                currentUser = session.user.id;
                return session;
            }
            throw new Error('用户未登录');
        } catch (error) {
            // 如果是网络错误，尝试从 localStorage 获取会话信息
            const cachedSession = localStorage.getItem('supabase.auth.token');
            if (cachedSession) {
                const session = JSON.parse(cachedSession);
                currentSession = session;
                currentUser = session.user.id;
                return session;
            }
            throw error;
        }
    }
    const init = async (force = false) => {
        if (initialized && !force) return;
        
        try {
            // 先尝试加载本地缓存
            const cached = localStorage.getItem('tasks-cache');
            if (cached) {
                set(JSON.parse(cached));
            }
    
            // 检查网络连接
            if (!navigator.onLine) {
                console.log('离线模式：使用缓存数据');
                return;
            }
    
            try {
                // 获取用户信息
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                
                if (authError) {
                    console.error('获取用户信息失败:', authError);
                    return;
                }
                
                if (!user) {
                    console.log('用户未登录，使用缓存数据');
                    return;
                }
    
                currentUser = user.id;
                
                // ... 其余代码保持不变 ...
    
            } catch (authError) {
                console.error('认证错误:', authError);
                // 认证错误时仍然使用缓存数据
                return;
            }
        } catch (error) {
            console.error('初始化任务失败:', error);
            // 不要抛出错误，而是返回，这样可以继续使用缓存数据
            return;
        }
    };

    type OfflineQueueData = {
        task: {
            add: Task;
            update: { id: string; updates: Partial<Task> };
            delete: { id: string };
        };
        subtask: {
            add: { subtask: Task; parentId: string };
            update: { id: string; parentId: string; updates: Partial<Task> };
            delete: { id: string; parentId: string };
        };
    };
    
    let offlineQueue: Array<{
        action: 'add' | 'update' | 'delete';
        type: 'task' | 'subtask';
        data: OfflineQueueData[keyof OfflineQueueData][keyof OfflineQueueData['task'] | keyof OfflineQueueData['subtask']];
        timestamp: number;
    }> = [];

     // 抽取离线任务处理逻辑
     function handleOfflineTask(task: Omit<Task, 'id'>) {
        const tempId = `temp_${Date.now()}`;
        const tempTask = { ...task, id: tempId };
        
        offlineQueue.push({
            action: 'add',
            type: 'task',
            data: tempTask,
            timestamp: Date.now()
        });
        
        update(tasks => [tempTask, ...tasks]);
        return tempId;
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
            console.log('检测到网络连接，开始同步离线数据...');
            syncOfflineChanges();
        });

        // 添加周期性网络检查
        setInterval(async () => {
            if (navigator.onLine && offlineQueue.length > 0) {
                console.log('周期性检查：检测到网络连接，开始同步离线数据...');
                await syncOfflineChanges();
            }
        }, 10000); // 每10秒检查一次
    }
    async function syncOfflineChanges() {
        if (syncTimeout) {
            clearTimeout(syncTimeout);
        }

        syncTimeout = setTimeout(async () => {
            try {
                if (!navigator.onLine) {
                    console.log('当前处于离线状态，跳过同步');
                    return;
                }

                console.log('开始同步离线更改...');
                const sortedQueue = [...offlineQueue].sort((a, b) => a.timestamp - b.timestamp);
                
                // 创建一个新的队列来处理更改，避免在同步过程中修改原始队列
                const processingQueue = [...sortedQueue];
                
                for (const change of processingQueue) {
                    console.log('正在处理更改:', change);
                    try {
                        await processChange(change);
                        // 成功处理后从原始队列中移除
                        offlineQueue = offlineQueue.filter(item => item.timestamp !== change.timestamp);
                        console.log('更改处理成功:', change);
                    } catch (error) {
                        console.error('处理单个更改失败:', error);
                        // 如果某个更改失败，记录错误并继续处理下一个
                        continue;
                    }
                }
                
                console.log('离线更改同步完成');
                
                // 强制重新初始化以获取最新数据
                await init(true);
            } catch (error) {
                console.error('同步离线更改失败:', error);
            }
        }, 1000); // 增加延迟时间，确保网络稳定
    }
    async function processChange(change: {
        action: 'add' | 'update' | 'delete';
        type: 'task' | 'subtask';
        data: OfflineQueueData[keyof OfflineQueueData][keyof OfflineQueueData['task'] | keyof OfflineQueueData['subtask']];
        timestamp: number;
    }) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('用户未登录');
    
            switch (change.action) {
                case 'add':
                    if (change.type === 'task') {
                        const taskData = change.data as Task;
                        const { data, error } = await supabase
                            .from('tasks')
                            .insert({ 
                                ...taskData,
                                user_id: user.id,
                                id: undefined // 让数据库生成新ID
                            })
                            .select()
                            .single();
    
                        if (error) {
                            console.error('插入任务失败:', error);
                            throw error;
                        }
    
                        // 更新本地状态
                        update(tasks => {
                            const updatedTasks = tasks.map(task => 
                                task.id === taskData.id ? { 
                                    ...data,
                                    subtasks: task.subtasks // 保留子任务
                                } : task
                            );
                            // 更新本地缓存
                            localStorage.setItem('tasks-cache', JSON.stringify(updatedTasks));
                            return updatedTasks;
                        });
                    }
                    break;
    
                    case 'update':
                        if (change.type === 'task') {
                            const taskData = change.data as OfflineQueueData['task']['update'];
                            await supabase
                                .from('tasks')
                                .update(taskData.updates)
                                .eq('id', taskData.id);
                        } else {
                            const subtaskData = change.data as OfflineQueueData['subtask']['update'];
                            await supabase
                                .from('subtasks')
                                .update(subtaskData.updates)
                                .eq('id', subtaskData.id);
                        }
                        break;
    
                    case 'delete':
                        if (change.type === 'task') {
                            const taskData = change.data as OfflineQueueData['task']['delete'];
                            await supabase
                                .from('tasks')
                                .delete()
                                .eq('id', taskData.id);
                        } else {
                            const subtaskData = change.data as OfflineQueueData['subtask']['delete'];
                            await supabase
                                .from('subtasks')
                                .delete()
                                .eq('id', subtaskData.id);
                        }
                        break;
            }
        } catch (error) {
            console.error('处理离线更改失败:', error);
            throw error;
        }
    }
    // ... 现有代码
    return {
        subscribe,
        set,
        update,
        init: async (force = false) => {
            if (initialized && !force) return;
            
            try {
                // 先尝试加载本地缓存
                const cached = localStorage.getItem('tasks-cache');
                if (cached) {
                    set(JSON.parse(cached));
                }
            
                // 检查网络连接
                if (!navigator.onLine) {
                    console.log('离线模式：使用缓存数据');
                    return;
                }
            
                // 获取用户信息
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                
                if (authError) {
                    console.error('获取用户信息失败:', authError);
                    return;
                }
                
                if (!user) {
                    console.log('用户未登录，使用缓存数据');
                    return;
                }
            
                currentUser = user.id;
                
                // 获取任务和子任务数据
                const { data: tasks, error } = await supabase
                    .from('tasks')
                    .select('*, subtasks(*)')
                    .eq('user_id', user.id);
            
                if (error) throw error;
                
                // 确保子任务数组存在
                const tasksWithSubtasks = tasks.map(task => ({
                    ...task,
                    subtasks: task.subtasks || []
                }));
                
                set(tasksWithSubtasks || []);
                localStorage.setItem('tasks-cache', JSON.stringify(tasksWithSubtasks || []));
                
                initialized = true;
            } catch (error) {
                console.error('初始化任务失败:', error);
                // 不要抛出错误，而是返回，这样可以继续使用缓存数据
                return;
            }
        },
        addTask: async (task: Omit<Task, 'id'>) => {
            try {
                // 确保有用户ID
                const session = await ensureSession();
                if (!session?.user?.id) {
                    throw new Error('用户未登录');
                }
        
                // 尝试在线添加
                const { data, error } = await supabase
                    .from('tasks')
                    .insert({ 
                        ...task, 
                        user_id: session.user.id,
                        date: new Date(task.date).toISOString().split('T')[0]
                    })
                    .select()
                    .single();
        
                if (error) {
                    // 任何错误都切换到离线模式
                    return handleOfflineTask({
                        ...task,
                        user_id: session.user.id
                    });
                }
        
                update(tasks => [data, ...tasks]);
                return data.id;
            } catch (error) {
                console.error('添加任务失败:', error);
                return handleOfflineTask({
                    ...task,
                    user_id: currentUser || ''
                });
            }
        },
        addSubtask: async (parentId: string, subtask: Omit<Task, 'id'>) => {
            try {
                if (!navigator.onLine) {
                    const tempId = `temp_${Date.now()}`;
                    const tempSubtask = {
                        ...subtask,
                        id: tempId,
                        parent_id: parentId,
                        user_id: currentUser || ''
                    };
                    
                    offlineQueue.push({
                        action: 'add',
                        type: 'subtask',
                        data: {
                            subtask: tempSubtask,
                            parentId: parentId
                        },
                        timestamp: Date.now()
                    });
                    
                    update(tasks => {
                        const updatedTasks = tasks.map(task => 
                            task.id === parentId 
                                ? { 
                                    ...task, 
                                    subtasks: [...(task.subtasks || []), tempSubtask] 
                                } 
                                : task
                        );
                        // 更新本地缓存
                        localStorage.setItem('tasks-cache', JSON.stringify(updatedTasks));
                        return updatedTasks;
                    });
                    return tempId;
                }
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('用户未登录');
        
                const { data, error } = await supabase
                    .from('subtasks')
                    .insert({ 
                        ...subtask, 
                        parent_id: parentId,
                        user_id: user.id
                    })
                    .select()
                    .single();
        
                if (error) throw error;
                update(tasks => {
                    const updatedTasks = tasks.map(task => 
                        task.id === parentId 
                            ? { 
                                ...task, 
                                subtasks: [...(task.subtasks || []), data] 
                            } 
                            : task
                    );
                    // 更新本地缓存
                    localStorage.setItem('tasks-cache', JSON.stringify(updatedTasks));
                    return updatedTasks;
                });
                return data.id;
            } catch (error) {
                console.error('添加子任务失败:', error);
                throw error;
            }
        },
        updateTask: async (id: string, updates: Partial<Task>) => {
            try {
                if (!navigator.onLine) {
                    offlineQueue.push({
                        action: 'update',
                        type: 'task',
                        data: {
                            id: id,
                            updates: updates
                        },
                        timestamp: Date.now()
                    });
                    
                    // 直接更新本地状态
                    update(tasks => tasks.map(task => 
                        task.id === id ? { ...task, ...updates } : task
                    ));
                    return;
                }
                const { error } = await supabase
                    .from('tasks')
                    .update(updates)
                    .eq('id', id);

                if (error) throw error;
                update(tasks => tasks.map(task => 
                    task.id === id ? { ...task, ...updates } : task
                ));
            } catch (error) {
                console.error('更新任务失败:', error);
                throw error;
            }
        },
        updateSubtask: async (id: string, parentId: string, updates: Partial<Task>) => {
            try {
                if (!navigator.onLine) {
                    
                    offlineQueue.push({
                        action: 'update',
                        type: 'subtask',
                        data: {
                            id: id,
                            parentId: parentId,
                            updates: updates
                        },
                        timestamp: Date.now()
                    });
                    
                    update(tasks => tasks.map(task => {
                        if (task.id === parentId) {
                            return {
                                ...task,
                                subtasks: task.subtasks?.map(subtask =>
                                    subtask.id === id ? { ...subtask, ...updates } : subtask
                                )
                            };
                        }
                        return task;
                    }));
                    return;
                }
                const { error } = await supabase
                    .from('subtasks')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;

                // 更新本地状态
                update(tasks => tasks.map(task => {
                    if (task.id === parentId) {
                        return {
                            ...task,
                            subtasks: task.subtasks?.map(subtask =>
                                subtask.id === id ? { ...subtask, ...updates } : subtask
                            )
                        };
                    }
                    return task;
                }));
            } catch (error) {
                console.error('更新子任务失败:', error);
                throw error;
            }
        },
        deleteTask: async (id: string) => {
            try {
                const { error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                update(tasks => tasks.filter(task => task.id !== id));
            } catch (error) {
                console.error('删除任务失败:', error);
                throw error;
            }
        },
        deleteSubtask: async (id: string, parentId: string) => {
            try {
                const { error } = await supabase
                    .from('subtasks')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                update(tasks => tasks.map(task =>
                    task.id === parentId ? {
                        ...task,
                        subtasks: task.subtasks?.filter(subtask => subtask.id !== id)
                    } : task
                ));
            } catch (error) {
                console.error('删除子任务失败:', error);
                throw error;
            }
        }
    };
}

export const tasks = createTaskStore();
