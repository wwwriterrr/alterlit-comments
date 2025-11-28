import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';
import './App.css'
import { Comments } from './pages/index';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/post/:postId/" element={<Comments />} />
                <Route path="*" element={<>404</>} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
