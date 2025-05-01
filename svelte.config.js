import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter({
            edge: false,
            split: true
        }),
        prerender: {
            handleHttpError: ({ path, referrer, message }) => {
                // Ignore 404s on prerendering
                if (message.includes('Not found')) return;
                throw new Error(message);
            }
        },
        paths: {
            base: ""
        },
        vite: {
            build: {
              sourcemap: true // 方便调试和 Vite PWA 插件生成
            }
          }
        
    },
    preprocess: vitePreprocess()
};

export default config;
