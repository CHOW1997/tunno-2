import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';

interface Locals {
  supabase: import('@supabase/supabase-js').SupabaseClient;
  getSession: () => Promise<Session | null>;
  session: Session | null;
}

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createSupabaseServerClient({
        supabaseUrl: PUBLIC_SUPABASE_URL,
        supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
        event,
    });
    

    event.locals.getSession = async () => {
        const { data: { session } } = await event.locals.supabase.auth.getSession();
        return session;
    };

    try {
        // Get session first
        // Get session
const session = await event.locals.getSession();
(event.locals as Locals).session = session;

        // Check if path is public
        const publicPaths = ['/login', '/register', '/auth/.*'];
        const isPublicPath = publicPaths.some(pattern => new RegExp(pattern).test(event.url.pathname));

        // Only redirect if not on public path and no session
        if (!isPublicPath && !session) {
            throw redirect(303, '/login');
        }

        return resolve(event, {
            filterSerializedResponseHeaders(name) {
                return name === 'content-range';
            },
        });
    } catch (error) {
        // Only rethrow if it's a redirect
        if (error instanceof Response && error.status === 303) {
            throw error;
        }
        // Log other errors but don't break the app
        console.error('Session handling error:', error);
        return resolve(event, {
            filterSerializedResponseHeaders(name) {
                return name === 'content-range';
            },
        });
    }
};