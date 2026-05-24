import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './AppRouter';
import './bootstrap';

const root = createRoot(document.getElementById('app'));
root.render(
    <BrowserRouter>
        <Toaster position="top-right" />
        <App />
    </BrowserRouter>
);
