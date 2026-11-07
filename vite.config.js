import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:page` makes one self-contained HTML file (used for the claude.ai preview link).
export default defineConfig(({ mode }) => ({
  plugins: [vue(), ...(mode === 'page' ? [viteSingleFile()] : [])],
  build: mode === 'page' ? { outDir: 'dist-page', assetsInlineLimit: Infinity } : {},
}))
