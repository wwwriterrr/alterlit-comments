import { useEffect, type FC, type ReactElement } from 'react';
import { useAppDispatch } from '../../services/store';
import { AuthCheckUser } from '../../services/auth/actions';

export const AuthHOC:FC<{children: ReactElement}> = ({children}) => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        let intervalId: number;

        dispatch(AuthCheckUser())
            .unwrap()
            .then(() => {
                intervalId = setInterval(() => {
                    console.log('refresh token');
                }, 60*1000*7)
            })

        return () => {
            clearInterval(intervalId);
        }
    }, [])

    return (
        <>
            {children}
        </>
    )
}
