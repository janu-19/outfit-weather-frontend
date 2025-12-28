import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy removed to prevent conflict with client-side routing (e.g., /wardrobe)
    // API calls now use absolute URL in api.js
  }
})
