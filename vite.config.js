import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/DELTAHUB-MCE/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    },
    define: {
        'import.meta.env.VITE_CLOUD_FUNCTIONS_BASE_URL': JSON.stringify(process.env.CLOUD_FUNCTIONS_BASE_URL || '')
    }
})

