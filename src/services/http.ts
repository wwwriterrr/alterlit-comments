import { ApiURL } from '../core/constants';

/** Ошибка API: статус и текст для пользователя (detail из ответа DRF). */
export class ApiError extends Error {
    status: number;
    detail: string;

    constructor(status: number, detail: string) {
        super(detail);
        this.status = status;
        this.detail = detail;
    }
}

let csrfFallback = '';
/** Токен CSRF, если куки csrftoken нет: <div id="comments-root" data-csrf="{{ csrf_token }}"> */
export const setCsrfFallback = (token: string) => {
    csrfFallback = token;
};

const csrfToken = () => {
    const m = document.cookie.match(/(?:^|; )csrftoken=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : csrfFallback;
};

const FALLBACK_ERROR = 'Не удалось выполнить действие. Попробуйте ещё раз.';

/**
 * Запрос к API с сессией (кука) и CSRF для изменяющих методов.
 * path — относительно /api/v1/; объект в body уходит JSON-ом, FormData — как есть.
 * Ответ без тела (204) — null. Ошибка — ApiError с detail сервера.
 */
export async function api<T = unknown>(
    path: string,
    { body, headers, ...init }: Omit<RequestInit, 'body'> & { body?: unknown } = {},
): Promise<T> {
    const h = new Headers(headers);
    h.set('Accept', 'application/json');
    const method = (init.method || 'GET').toUpperCase();
    if (method !== 'GET') {
        const token = csrfToken();
        if (token) h.set('X-CSRFToken', token);
    }
    let payload: BodyInit | undefined;
    if (body instanceof FormData) {
        payload = body;
    } else if (body !== undefined) {
        h.set('Content-Type', 'application/json');
        payload = JSON.stringify(body);
    }

    const response = await fetch(ApiURL + path, { ...init, headers: h, body: payload, credentials: 'same-origin' });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
        const detail = typeof data?.detail === 'string' ? data.detail : FALLBACK_ERROR;
        throw new ApiError(response.status, detail);
    }
    return data as T;
}

/** Текст ошибки для показа: detail сервера или общий. */
export const errorText = (err: unknown) => (err instanceof ApiError ? err.detail : FALLBACK_ERROR);
