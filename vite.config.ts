import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

// В dev API, медиа и сокет проксируются на бэкенд — запросы идут на тот же домен, что и страница,
// как на сайте. DEV_COOKIE (строка Cookie из браузера) в .env.local — сессия для прокси;
// он же подставляет X-CSRFToken, Origin и Referer для CSRF Django.
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const backend = (env.BACKEND_URL || 'https://alterlit.ru').replace(/\/$/, '');
    const devCookie = env.DEV_COOKIE || '';
    const csrf = /(?:^|;\s*)csrftoken=([^;]+)/.exec(devCookie)?.[1];

    const proxy = (ws = false): ProxyOptions => ({
        target: ws ? backend.replace(/^http/, 'ws') : backend,
        ws,
        changeOrigin: true,
        secure: true,
        configure: (p) => {
            if (!devCookie) return;
            const inject = (req: { setHeader: (k: string, v: string) => void }) => {
                req.setHeader('cookie', devCookie);
                req.setHeader('origin', backend);
                req.setHeader('referer', backend + '/');
                if (csrf) req.setHeader('x-csrftoken', csrf);
            };
            p.on('proxyReq', (req) => inject(req));
            p.on('proxyReqWs', (req) => inject(req));
            // сессией управляет DEV_COOKIE — куки бэкенда в браузер не пропускаем
            p.on('proxyRes', (res) => {
                delete res.headers['set-cookie'];
            });
        },
    });

    return {
        build: {
            assetsDir: 'assets/comments',
            rollupOptions: {
                output: {
                    // входной файл — постоянное имя, версия — ?v= в шаблоне;
                    // чанки и стили, которые он подгружает сам, — с хешами (кеш не подсунет старые)
                    entryFileNames: 'assets/comments/comments.js',
                    chunkFileNames: 'assets/comments/[name]-[hash].js',
                    assetFileNames: 'assets/comments/[name]-[hash][extname]',
                    // служебная функция предзагрузки — отдельным чанком: иначе она оказывается
                    // во входном файле, и чанки импортируют его как ./comments.js — без ?v= из
                    // шаблона. Для браузера это другой модуль: вход исполняется второй раз и
                    // приложение монтируется дважды (два списка, два сокета, скачки прокрутки).
                    manualChunks: (id) => (id.includes('vite/preload-helper') ? 'preload' : undefined),
                },
            },
        },
        plugins: [
            react({
                babel: {
                    plugins: ['babel-plugin-react-compiler'],
                },
            }),
        ],
        server: {
            port: 5177,
            proxy: {
                '/api': proxy(),
                '/media': proxy(),
                '/assets/img': proxy(),
                '/ws': proxy(true),
            },
        },
    }
})
