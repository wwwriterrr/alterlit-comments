import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { setCsrfFallback } from './services/http';

/** Само приложение комментариев — его подгружает main.tsx, когда блок подходит к экрану. */
export function mount(root: HTMLElement) {
    // куки csrftoken может не быть — тогда токен из шаблона: <div id="comments-root" data-csrf="{{ csrf_token }}">
    setCsrfFallback(root.dataset.csrf ?? '');

    createRoot(root).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}
