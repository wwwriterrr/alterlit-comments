import { useEffect, type FC, type ReactElement } from 'react';
import { useAppDispatch } from '../../services/store';
import { AuthCheckUser, AuthRefreshToken } from '../../services/auth/actions';

export const AuthHOC:FC<{children: ReactElement}> = ({children}) => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        let intervalId: number;

        dispatch(AuthCheckUser())
            .unwrap()
            .then(() => {
                intervalId = setInterval(() => {
                    console.log('refresh token');
                    dispatch(AuthRefreshToken({signal}))
                        .unwrap()
                        .then(() => {console.log('Token updated')})
                        .catch(() => {clearInterval(intervalId)})
                }, 60*1000*7)
            })

        return () => {
            clearInterval(intervalId);
            if(!signal.aborted) controller.abort();
        }
    }, [])

    return (
        <>
            {children}
        </>
    )
}
