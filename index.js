// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Yeni eklenen


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Tüm uygulamayı BrowserRouter ve AuthProvider ile sarıyoruz */}
   
      <AuthProvider>
        <App />
      </AuthProvider>
  
  </React.StrictMode>
);