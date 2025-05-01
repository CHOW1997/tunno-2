import { browser } from '$app/environment';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface TraeDB extends DBSchema {
    expenses: {
        key: string;
        value: {
            id: string;
            amount: number;
            description: string;
            category: string;
            date: string;
        };
        indexes: { 'by-date': string };
    };
    tasks: {
        key: string;
        value: {
            id: string;
            title: string;
            completed: boolean;
            date: string;
            remindDaily?: boolean;  // Make sure this matches your Task interface
        };
        indexes: { 'by-date': string };
    };
}

class DatabaseService {
    private db: Promise<IDBPDatabase<TraeDB>> | null = null;

    constructor() {
        if (browser) {
            this.initDatabase();
        }
    }

    private async initDatabase() {
        try {
            console.log('开始初始化数据库');
            this.db = openDB<TraeDB>('trae-guide', 1, {
                upgrade(db) {
                    console.log('数据库升级中');
                    if (!db.objectStoreNames.contains('expenses')) {
                        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
                        expenseStore.createIndex('by-date', 'date');
                        console.log('expenses store 已创建');
                    }
                    if (!db.objectStoreNames.contains('tasks')) {
                        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
                        taskStore.createIndex('by-date', 'date');
                        console.log('tasks store 已创建');
                    }
                },
            });
            const dbInstance = await this.db;
            console.log('数据库初始化成功，stores:', Array.from(dbInstance.objectStoreNames));
        } catch (error) {
            console.error('数据库初始化失败:', error);
        }
    }

    // 修改所有数据库方法添加错误处理
    async getAllExpenses() {
        if (!browser || !this.db) return [];
        try {
            return (await this.db).getAll('expenses');
        } catch (error) {
            console.error('获取支出失败:', error);
            return [];
        }
    }

    async addExpense(expense: Omit<TraeDB['expenses']['value'], 'id'>) {
        const id = crypto.randomUUID();
if (!this.db) throw new Error('Database not initialized');
await (await this.db).add('expenses', { ...expense, id });
        return id;
    }

    async deleteExpense(id: string) {
        if (!browser || !this.db) return;
        try {
            await (await this.db).delete('expenses', id);
        } catch (error) {
            console.error('删除支出失败:', error);
        }
    }

    // 任务相关方法
    async getAllTasks() {
        if (!browser || !this.db) return [];
        try {
            return (await this.db).getAll('tasks');
        } catch (error) {
            console.error('获取任务失败:', error);
            return [];
        }
    }

    async addTask(task: Omit<TraeDB['tasks']['value'], 'id'>) {
        if (!browser || !this.db) throw new Error('Database not initialized');
        try {
            const id = crypto.randomUUID();
            await (await this.db).add('tasks', { ...task, id });
            return id;
        } catch (error) {
            console.error('添加任务失败:', error);
            throw error;
        }
    }

    async updateTask(id: string, task: Partial<TraeDB['tasks']['value']>) {
        if (!browser || !this.db) throw new Error('Database not initialized');
        try {
            const db = await this.db;
            const existingTask = await db.get('tasks', id);
            if (!existingTask) throw new Error('Task not found');
            await db.put('tasks', { ...existingTask, ...task });
        } catch (error) {
            console.error('更新任务失败:', error);
            throw error;
        }
    }

    async deleteTask(id: string) {
        if (!browser || !this.db) return;
        try {
            await (await this.db).delete('tasks', id);
        } catch (error) {
            console.error('删除任务失败:', error);
        }
    }
}

export const db = new DatabaseService();