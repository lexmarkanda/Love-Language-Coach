import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fixed: Removed loadEnv and manual process.env.API_KEY definition to resolve the 'cwd' error 
// and follow guidelines regarding automatic API key injection.
export default defineConfig(() => {
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    server: {
      port: 3000
    }
  };
});
