import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Get initial values from localStorage
const initialDarkMode = browser ? localStorage.getItem('darkMode') === 'true' : false;
const initialNotifications = browser ? localStorage.getItem('notifications') === 'true' : false;

// Create stores
export const darkMode = writable(initialDarkMode);
export const notifications = writable(initialNotifications);

// Subscribe to changes and save to localStorage
if (browser) {
    darkMode.subscribe(value => {
        localStorage.setItem('darkMode', value.toString());
    });

    notifications.subscribe(value => {
        localStorage.setItem('notifications', value.toString());
    });
}