import { useEffect, useState } from 'react';

export const useTouchScreen = (): boolean => {
    const [isTouchScreen, setIsTouchScreen] = useState<boolean>(() => {
        // Проверяем различные способы определения тачскрина
        const hasTouchStart = 'ontouchstart' in window;
        const hasTouchPoints = navigator.maxTouchPoints > 0;
        const hasTouch = window.TouchEvent !== undefined;
        
        return hasTouchStart || hasTouchPoints || hasTouch;
    });

    useEffect(() => {
        // Дополнительная проверка через медиа-запрос для более точного определения
        const mediaQuery = window.matchMedia('(pointer: coarse)');
        
        const handleMediaChange = (e: MediaQueryListEvent) => {
            // Комбинируем результаты разных проверок
            const hasTouchStart = 'ontouchstart' in window;
            const hasTouchPoints = navigator.maxTouchPoints > 0;
            const hasTouch = window.TouchEvent !== undefined;
            const hasCoarsePointer = e.matches;
            
            setIsTouchScreen(hasTouchStart || hasTouchPoints || hasTouch || hasCoarsePointer);
        };

        // Устанавливаем начальное значение с учетом медиа-запроса
        const hasTouchStart = 'ontouchstart' in window;
        const hasTouchPoints = navigator.maxTouchPoints > 0;
        const hasTouch = window.TouchEvent !== undefined;
        const hasCoarsePointer = mediaQuery.matches;
        
        queueMicrotask(() => setIsTouchScreen(hasTouchStart || hasTouchPoints || hasTouch || hasCoarsePointer));

        // Слушаем изменения медиа-запроса
        mediaQuery.addEventListener('change', handleMediaChange);

        return () => {
            mediaQuery.removeEventListener('change', handleMediaChange);
        };
    }, []);

    return isTouchScreen;
};
