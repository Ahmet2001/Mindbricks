import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/auth-api': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
      '/mcpbff-api': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
      '/aiagent-api': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
      '/classassignment-api': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
      '/languageprofile-api': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
      '/listeninglab-api': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
      '/personalvocabulary-api': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
      '/readinglab-api': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
      '/speakinglab-api': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
      '/writinglab-api': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
      '/bucket': {
        target: 'https://solvio.prw.mindbricks.com',
        changeOrigin: true,
      },
    },
  },
})
