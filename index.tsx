import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Intercept and handle internal SDK assertion edge cases in Firebase Auth popup handler
if (typeof window !== 'undefined') {
  const origConsoleError = console.error;
  console.error = (...args: any[]) => {
    const first = args[0] ? String(args[0]) : '';
    if (
      first.includes('Pending promise was never set') ||
      (first.includes('@firebase/auth') && first.includes('INTERNAL ASSERTION FAILED'))
    ) {
      console.warn('[Firebase Auth Handled Assertion]:', ...args);
      return;
    }
    origConsoleError(...args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event ? event.reason : null;
      const msg = typeof reason === 'string' ? reason : (reason?.message ? String(reason.message) : '');
      if (msg && (msg.includes('Pending promise was never set') || msg.includes('INTERNAL ASSERTION FAILED'))) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        console.warn('[Firebase Auth Handled Assertion]:', msg);
      }
    } catch (_) {}
  }, true);

  window.addEventListener('error', (event) => {
    try {
      const msg = (event && event.message) ? String(event.message) : '';
      if (msg && (msg.includes('Pending promise was never set') || msg.includes('INTERNAL ASSERTION FAILED'))) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        console.warn('[Firebase Auth Handled Assertion]:', msg);
      }
    } catch (_) {}
  }, true);
}

// Register PWA Service Worker for native Android 1-click app install
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
