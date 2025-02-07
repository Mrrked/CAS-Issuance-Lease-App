import { defineConfig, loadEnv } from 'vite';

import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const port = parseInt(env.VITE_CUSTOM_PORT) || 3000;      // Default to 3000 if not provided
  const host = env.VITE_CUSTOM_HOST || 'localhost';         // Default to 'localhost'

  return {
    plugins: [
      vue(),
      Components({
        resolvers: [PrimeVueResolver()],
      }),
    ],
    server: {
      host,
      port,
    },
    define: {
      __APP_HOST__: JSON.stringify(host),
      __APP_PORT__: port,
    },
  };
});
