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

function App() {
    return (
        <Provider store={store}>
            <AuthHOC>
                <ModalHOC>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/post/:postId/" element={<Comments />} />
                            <Route path="*" element={<>404</>} />
                        </Routes>
                    </BrowserRouter>
                </ModalHOC>
            </AuthHOC>
        </Provider>
    )
}

export default App
