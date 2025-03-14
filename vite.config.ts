import { defineConfig } from 'vite';

import dts from 'vite-plugin-dts'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';
import { erauVite } from './erau-vite-plugin';


// https://vitejs.dev/config/
export default defineConfig((props) => {
  const { command } = props;
  console.log(`Building ${__dirname}`);

  return {
    mode: 'production',
    base: '/calendar-crawler/',
    plugins: [
      react({ }),
      dts({ rollupTypes: true }),
      checker({ typescript: true }),
      svgr({ svgrOptions: {} }),
      erauVite({})
    ],
    build: {
      outDir: 'dist',
      rollupOptions: {
        plugins: [peerDepsExternal()],
      }
    },
  }
});