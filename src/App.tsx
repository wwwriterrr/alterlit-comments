import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';
import { Comments } from './pages/index';
import { Provider } from 'react-redux';
import { store } from './services/store';
import { AuthHOC } from './HOC/auth';
import { ModalHOC } from './HOC/modal';
import { ViewerProvider } from './HOC/viewer';

function App() {
    return (
        <Provider store={store}>
            <AuthHOC>
                <>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/post/:postId/" element={<Comments />} />
                            <Route path="*" element={<>404</>} />
                        </Routes>
                    </BrowserRouter>
                    <ModalHOC />
                    <ViewerProvider />
                </>
            </AuthHOC>
        </Provider>
    )
}

export default App
