import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Search for the API key in all possible common environment variable names
  const apiKey = 
    env.API_KEY || 
    env.VITE_API_KEY || 
    env.GOOGLE_API_KEY || 
    env.GEMINI_API_KEY || 
    env.REACT_APP_API_KEY ||
    env.NEXT_PUBLIC_API_KEY ||
    process.env.API_KEY || 
    process.env.VITE_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.GEMINI_API_KEY || 
    '';

  return {
    plugins: [react()],
    define: {
      // Define process.env.API_KEY globally for the client build
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});