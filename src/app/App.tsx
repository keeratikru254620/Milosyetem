import { BrowserRouter as Router } from 'react-router-dom';

import ConfirmContainer from '../components/global/ConfirmContainer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ToastContainer from '../components/global/ToastContainer';
import AppContainer from './AppContainer';

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppContainer />
        <ToastContainer />
        <ConfirmContainer />
      </ErrorBoundary>
    </Router>
  );
}
