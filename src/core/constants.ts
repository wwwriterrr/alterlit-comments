// Всё — на том же домене, что и страница: API и сокет по относительным путям, сессия — по куке.
// В dev их проксирует Vite (vite.config.ts) на боевой сайт.
export const HostURL = '';
export const ApiURL = '/api/v1/';
export const WsURL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/`;
