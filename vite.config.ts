// import path from 'path';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  // resolve: {
  //   alias: [
  //     // перенаправляем любые импорты index.css на пустой файл в проекте
  //     { find: /(^|\/)index\.css$/, replacement: path.resolve(__dirname, 'src/empty.css') }
  //   ]
  // },
  // build: {
  //   rollupOptions: {
  //     // пометить как external (полезно для JS-модулей)
  //     external: [/index\.css$/]
  //   }
  // }
})
