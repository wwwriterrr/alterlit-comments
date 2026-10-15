import { useEffect, type FC, type ReactElement } from 'react';
import { useAppDispatch } from '../../services/store';
import { AuthCheckUser } from '../../services/auth/actions';

/** Кто смотрит страницу — по сессии (кука), без токенов в шаблоне. Права на запись — на странице поста. */
export const AuthHOC: FC<{ children: ReactElement }> = ({ children }) => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(AuthCheckUser());
    }, [dispatch]);

    return <>{children}</>;
};
