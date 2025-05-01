import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
    const { session } = await parent();
    
    // Add detailed session logging
    console.log('Retrieved session:', session);
    console.log('Current time:', Date.now());
    if (session?.expiresAt) {
        console.log('Session expires at:', session.expiresAt * 1000);
    }

    // Add session validation
    if (!session?.user || !session.expiresAt || Date.now() > session.expiresAt * 1000) {
        console.warn('Invalid session - redirecting to login');
        throw redirect(303, '/login');
    }
    
    return { user: session.user };
};
