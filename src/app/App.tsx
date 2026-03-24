import { BrowserRouter as Router } from 'react-router-dom';

import ConfirmContainer from '../components/global/ConfirmContainer';
import ToastContainer from '../components/global/ToastContainer';
import AppContainer from './AppContainer';

export default function App() {
  return (
    <Router>
      <AppContainer />
      <ToastContainer />
      <ConfirmContainer />
    </Router>
  );
}