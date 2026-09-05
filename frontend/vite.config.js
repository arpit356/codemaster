import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js is large — increase chunk warning threshold
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Three.js into its own vendor chunk for caching
          'vendor-three': ['three'],
          // Split React ecosystem 
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Split Monaco Editor
          'vendor-monaco': ['@monaco-editor/react'],
          // Split Recharts
          'vendor-recharts': ['recharts'],
        }
      }
    }
  }
})
