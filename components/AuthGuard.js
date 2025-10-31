// src/components/AuthGuard.js (TAM KOD)

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const AuthGuard = ({ children, roles }) => {
    const { currentUser, userRole, loading } = useAuth();
    
    if (loading) {
        return <div style={{textAlign: 'center', padding: '50px'}}>Yetkilendirme Kontrol Ediliyor...</div>;
    }

    if (!currentUser) {
        // Giriş yapmamışsa anasayfaya (LoginPage'e) yönlendir.
        return <Navigate to="/" replace />;
    }

    if (roles && roles.length > 0) {
        if (!userRole || !roles.includes(userRole)) {
            // İzin verilmiyorsa, kullanıcının kendi paneline yönlendir
            return <Navigate to={`/${userRole}`} replace />;
        }
    }

    return children;
};

export default AuthGuard;