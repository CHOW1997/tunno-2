import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';

export type Expense = {
    id: string;
    amount: number;
    description: string;
    date: string;
    user_id: string; // 添加用户ID字段
    created_at?: string;
};

function createExpenseStore() {
    const { subscribe, set, update } = writable<Expense[]>([]);

    return {
        subscribe,
        set,
        update,
        init: async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('用户未登录');

                const { data, error } = await supabase
                    .from('expenses')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false });

                if (error) throw error;
                set(data || []);
            } catch (error) {
                console.error('初始化支出失败:', error);
                throw error;
            }
        },
        add: async (expense: Omit<Expense, 'id'>) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('用户未登录');

                const { data, error } = await supabase
                    .from('expenses')
                    .insert({ 
                        ...expense, 
                        user_id: user.id 
                    })
                    .select()
                    .single();

                if (error) throw error;
                update(expenses => [data, ...expenses]);
                return data.id;
            } catch (error) {
                console.error('添加支出失败:', error);
                throw error;
            }
        },
        delete: async (id: string) => {
            try {
                const { error } = await supabase
                    .from('expenses')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                update(expenses => expenses.filter(e => e.id !== id));
            } catch (error) {
                console.error('删除支出失败:', error);
                throw error;
            }
        }
    };
}

export const expenses = createExpenseStore();