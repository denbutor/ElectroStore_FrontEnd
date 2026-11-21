import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <LanguageProvider>
                <AuthProvider>
                    <CartProvider>
                        <ToastProvider>
                            <App />
                        </ToastProvider>
                    </CartProvider>
                </AuthProvider>
            </LanguageProvider>
        </BrowserRouter>
    </React.StrictMode>
);
