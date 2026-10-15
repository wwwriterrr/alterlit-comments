// Входной файл (comments.js) — крошечный загрузчик. Блок комментариев стоит внизу поста,
// поэтому само приложение (React, список, стили) подгружается, только когда он подходит
// к экрану. Кто не дочитал до комментариев — не скачивает ничего.

const root = document.getElementById('comments-root');

/** Заранее, за пару экранов до блока — к моменту прокрутки список уже на месте. */
const PRELOAD_MARGIN = '1200px 0px';

if (root) {
    let started = false;
    const load = () => {
        if (started) return;
        started = true;
        import('./bootstrap').then(({ mount }) => mount(root));
    };

    const search = new URLSearchParams(location.search);
    // ссылка на комментарий (?anchor=comments&comment_id=…) — грузим сразу, страница прокрутится к нему
    const wantsComments = search.get('anchor') === 'comments' || location.hash === '#comments';

    if (wantsComments || !('IntersectionObserver' in window)) {
        load();
    } else {
        const io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                io.disconnect();
                load();
            }
        }, { rootMargin: PRELOAD_MARGIN });
        io.observe(root);
    }
}
