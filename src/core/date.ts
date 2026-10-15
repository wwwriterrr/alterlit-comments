// Даты комментариев — как в сообщениях (чате).
// С сервера они приходят без часового пояса (USE_TZ=False) — это время сервера, Москва.
const SERVER_OFFSET = '+03:00';

const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const dayMonthYear = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const full = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' });

export const parseDate = (value: string | number) =>
    typeof value === 'number'
        ? new Date(value)
        : new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : value + SERVER_OFFSET);

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** «14:05», «вчера, 14:05», «3 октября, 14:05», «3 октября 2024 г., 14:05». */
export function formatCommentDate(value: string | number) {
    const d = parseDate(value);
    const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
    const hm = time.format(d);
    if (days === 0) return hm;
    if (days === 1) return `вчера, ${hm}`;
    const day = d.getFullYear() === new Date().getFullYear() ? dayMonth.format(d) : dayMonthYear.format(d);
    return `${day}, ${hm}`;
}

/** Полная дата для подсказки: «14 октября 2026 г. в 14:05». */
export const formatFullDate = (value: string | number) => full.format(parseDate(value));
