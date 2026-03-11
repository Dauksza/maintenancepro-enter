import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
      ...(mode === 'development'
        ? { '@github/spark/hooks': resolve(projectRoot, 'src/lib/spark-hooks.ts') }
        : {}),
    }
  },
  optimizeDeps: {
    // @huggingface/transformers uses dynamic imports for WASM/ONNX backends
    // that are incompatible with Vite's static dep pre-bundling.
    exclude: ['@huggingface/transformers'],
  },
}));
