import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const operatorBuildOutputDir = String(process.env.FINPLE_BUILD_OUTPUT_DIR || '').trim()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: operatorBuildOutputDir
    ? {
        outDir: operatorBuildOutputDir,
        emptyOutDir: true,
      }
    : undefined,
})
