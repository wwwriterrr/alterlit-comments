import type { FC, ReactElement } from 'react';

export const AuthHOC:FC<{children: ReactElement}> = ({children}) => {
    return (
        <>
            {children}
        </>
    )
}
