import ReactDOM from 'react-dom/client';

import App from './app/App';
import './index.css';
import { initializeFirebaseAnalytics } from './services/firebaseConfig';

void initializeFirebaseAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
