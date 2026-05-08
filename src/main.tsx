import ReactDOM from 'react-dom/client';
import App from './app/App';

import './index.css';

const bootFallback = document.getElementById('boot-fallback');
if (bootFallback) {
  bootFallback.style.display = 'none';
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found');
}

const renderStartupError = (error: unknown) => {
  console.error('Application bootstrap failed:', error);
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}\n${error.stack || ''}`.trim()
      : String(error ?? 'Unknown startup error');
  rootElement.innerHTML =
    `<div style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; padding: 24px; color: #7f1d1d; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; margin: 16px;">
      <div style="font-family: sans-serif; font-weight: 700; margin-bottom: 8px;">Application failed to start</div>
      <pre style="white-space: pre-wrap; margin: 0; color: #991b1b;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>`;
};

try {
  ReactDOM.createRoot(rootElement).render(<App />);
} catch (error) {
  renderStartupError(error);
}
