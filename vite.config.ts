import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-vercel';

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter(),
      alias: {
        $lib: 'src/lib',
        '$lib/*': 'src/lib/*'
      }
    })
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
