import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import WindiCSS from 'vite-plugin-windicss'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

import nodePolyfills from 'rollup-plugin-polyfill-node'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), WindiCSS()],
  resolve: {
    alias: {
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
      global: 'rollup-plugin-node-polyfills/polyfills/global',
      process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
      http: 'http',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    polyfillModulePreload: true,
    rollupOptions: {
      plugins: [
        // Enable rollup polyfills plugin
        // used during production bundling
        nodePolyfills(),
      ],
    },
  },
})
