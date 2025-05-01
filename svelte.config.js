import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      split: true,
      edge: false,
      external: [],
      fallback: null,
    }),
    prerender: {
      handleHttpError: ({ message }) => {
        if (message.includes('Not found')) return;
        throw new Error(message);
      }
    },
    paths: {
      base: ''
    }
  },
  preprocess: vitePreprocess()
};

export default config;
