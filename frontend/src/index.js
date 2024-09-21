import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { gsap } from 'gsap';

// GSAP animation for initial load
gsap.set('body', { opacity: 0 });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Add a GSAP animation to fade in the body
gsap.to('body', { opacity: 1, duration: 1, ease: 'power2.inOut' });