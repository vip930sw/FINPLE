import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const operatorBuildOutputDir = String(process.env.FINPLE_BUILD_OUTPUT_DIR || '').trim()
const deploymentSha = String(process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '').trim()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'globalThis.__FINPLE_DEPLOYMENT_SHA__': JSON.stringify(deploymentSha),
  },
  build: operatorBuildOutputDir
    ? {
        outDir: operatorBuildOutputDir,
        emptyOutDir: true,
      }
    : undefined,
})
