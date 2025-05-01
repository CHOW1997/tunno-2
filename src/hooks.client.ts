import type { HandleClientError } from '@sveltejs/kit';

export const init = () => {
    // Initialize any client-side logic here
    console.log('Client initialized');
};

export const handleError: HandleClientError = ({ error }) => {
    console.error('Client error:', error);
    return {
        message: 'An unexpected error occurred.'
    };
};