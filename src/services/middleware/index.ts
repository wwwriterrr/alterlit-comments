import { type ActionCreatorWithoutPayload, type ActionCreatorWithPayload, type Middleware } from '@reduxjs/toolkit';
import { type RootState } from '../store';

export type TWsActionTypes<S, R> = {
    connect: ActionCreatorWithPayload<string>;
    disconnect: ActionCreatorWithoutPayload;
    sendMessage?: ActionCreatorWithPayload<S>;
    onConnecting?: ActionCreatorWithoutPayload;
    onOpen?: ActionCreatorWithoutPayload;
    onClose?: ActionCreatorWithoutPayload;
    onError: ActionCreatorWithPayload<string>;
    onMessage: ActionCreatorWithPayload<R>;
};

const RECONNECT_PERIOD = 3000;

export const socketMiddleware = <S, R>(
    wsActions: TWsActionTypes<S, R>,
    withTokenRefresh: boolean = false
): Middleware<NonNullable<unknown>, RootState> => {
    return (store) => {
        let socket: WebSocket | null = null;
        const {
            connect,
            sendMessage,
            onOpen,
            onClose,
            onError,
            onMessage,
            onConnecting,
            disconnect,
        } = wsActions;
        let isConnected = false;
        let reconnectTimer = 0;
        let url = '';
        
        return (next) => (action) => {
            const {dispatch} = store;

            if(connect.match(action)){
                url = action.payload;
                socket = new WebSocket(url);
                isConnected = true;
                if(onConnecting) dispatch(onConnecting());

                socket.onopen = () => {
                    if(onOpen) dispatch(onOpen());
                }

                socket.onerror = () => {
                    dispatch(onError('Error with socket connect'))
                }

                socket.onmessage = (event) => {
                    const {data} = event;

                    try{
                        const parsedData = JSON.parse(data);

                        console.log('Refresh token params', withTokenRefresh);
                        // if (withTokenRefresh && parsedData.message === 'Invalid or missing token') {
                        //     const refreshToken = localStorage.getItem('refreshToken');

                        //     if(!refreshToken) {
                        //         dispatch(disconnect());

                        //         return;
                        //     }

                        //     api.RefreshToken(refreshToken)
                        //         .then(refreshData => {
                        //             const wssUrl = new URL(url);
                        //             wssUrl.searchParams.set(
                        //                 "token",
                        //                 refreshData.replace('Bearer ', '')
                        //             );
                        //             dispatch(connect(wssUrl.toString()));
                        //         })
                        //         .catch(err => {
                        //             dispatch(onError((err as Error).message));
                        //         });
                        
                        //     dispatch(disconnect());

                        //     return;
                        // }

                        if(onMessage) dispatch(onMessage(parsedData));
                    } catch (err) {
                        dispatch(onError((err as Error).message));
                    }
                }

                socket.onclose = () => {
                    if(onClose) dispatch(onClose());

                    if(isConnected){
                        reconnectTimer = window.setTimeout(() => {
                            dispatch(connect(url));
                        }, RECONNECT_PERIOD);
                    }
                }
            }

            if(socket && sendMessage?.match(action)) {
                try{
                    socket.send(JSON.stringify(action.payload));
                } catch (err) {
                    dispatch(onError((err as Error).message));
                }
            }

            if(socket && disconnect.match(action)){
                clearTimeout(reconnectTimer);
                isConnected = false;
                reconnectTimer = 0;
                socket.close();
                socket = null;
            }

            next(action);
        }
    }
}
