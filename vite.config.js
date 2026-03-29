import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/synthesis-journal/', // 注意：前后都有斜杠，且名字必须和 GitHub 仓库名完全一致
})