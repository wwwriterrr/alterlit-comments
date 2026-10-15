import { lazy, Suspense, useEffect, useRef, useState, type FC, type ReactElement } from 'react';
import { getModalVisible } from '../../services/modal/slice';
import { useAppSelector } from '../../services/store';

// motion и само окно — отдельным чанком: до первого открытия модалки они не нужны
const ModalLayer = lazy(() => import('./layer'));

export const ModalHOC: FC<{ children?: ReactElement }> = ({ children }) => {
    const modalVisible = useAppSelector(getModalVisible);
    // слой, загрузившись, остаётся смонтированным — иначе не отыграет анимация закрытия
    const [wanted, setWanted] = useState(false);
    if (modalVisible && !wanted) setWanted(true);

    const top = useRef<number>(0);
    const savedStyle = useRef<string | null>(null);

    // Фиксация страницы под открытой модалкой. Только на открытие и закрытие: при монтировании
    // ничего не трогаем — приложение монтируется уже прокрученным к комментариям (ленивая
    // загрузка), и прежний «сброс» прокручивал страницу в самый верх и стирал стили body.
    useEffect(() => {
        const body = document.body;

        if (modalVisible) {
            top.current = window.scrollY;
            savedStyle.current = body.getAttribute('style');
            body.style.position = 'fixed';
            body.style.top = `-${top.current}px`;
            body.style.height = '100vh';
            body.style.width = '100%';
        } else if (savedStyle.current !== null || body.style.position === 'fixed') {
            // возвращаем стили body, какими они были до модалки (сайт тоже их ставит)
            if (savedStyle.current) body.setAttribute('style', savedStyle.current);
            else body.removeAttribute('style');
            savedStyle.current = null;
            window.scrollTo(0, top.current);
        }
    }, [modalVisible])

    return (
        <>
            {children}
            {wanted ? (
                <Suspense fallback={null}>
                    <ModalLayer visible={modalVisible} />
                </Suspense>
            ) : null}
        </>
    )
}
