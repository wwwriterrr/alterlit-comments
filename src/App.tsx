import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';
import './App.css'
import { Comments } from './pages/index';
import { Provider } from 'react-redux';
import { store } from './services/store';
import { AuthHOC } from './HOC/auth';

function App() {
    return (
        <Provider store={store}>
            <AuthHOC>
                <BrowserRouter>
                    <Routes>
                        <Route path="/post/:postId/" element={<Comments />} />
                        <Route path="*" element={<>404</>} />
                    </Routes>
                </BrowserRouter>
            </AuthHOC>
        </Provider>
    )
}

export default App
