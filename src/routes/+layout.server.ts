import type { LayoutServerLoad } from './$types';

import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ url, locals }) => {
    const session = locals.getSession();

    // 定义公开路由
    const publicRoutes = ['/login', '/register', '/auth'];
    const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));

    if (!session && !isPublicRoute) {
        throw redirect(303, '/login');
    }

    return {
        session
    };
};