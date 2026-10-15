import { lazy, Suspense, useState, type FC, type ReactElement } from 'react';
import { useAppSelector } from '../../services/store';
import { getViewerOpen } from '../../services/viewer/slice';

// motion и просмотрщик — отдельным чанком: до первого открытия картинки они не нужны
const ViewerLayer = lazy(() => import('./layer'));

export const ViewerProvider: FC<{ children?: ReactElement }> = ({ children }) => {
    const isViewerOpen = useAppSelector(getViewerOpen);
    // слой, загрузившись, остаётся смонтированным — иначе не отыграет анимация закрытия
    const [wanted, setWanted] = useState(false);
    if (isViewerOpen && !wanted) setWanted(true);

    return (
        <>
            {children}
            {wanted ? (
                <Suspense fallback={null}>
                    <ViewerLayer open={isViewerOpen} />
                </Suspense>
            ) : null}
        </>
    );
};
