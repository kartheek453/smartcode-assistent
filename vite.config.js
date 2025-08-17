import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Add your repo name as base (case-sensitive)
export default defineConfig({
  plugins: [react()],
  base: '/Ai-Debugger/',
})
