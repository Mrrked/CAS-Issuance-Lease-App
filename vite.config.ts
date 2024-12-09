import { defineConfig, loadEnv } from 'vite';

import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for the current mode
  const env = loadEnv(mode, process.cwd());

  // Parse port and host from environment variables
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
      host, // Host from environment variable
      port, // Port from environment variable
    },
    define: {
      __APP_HOST__: JSON.stringify(host),
      __APP_PORT__: port,
    },
  };
});
