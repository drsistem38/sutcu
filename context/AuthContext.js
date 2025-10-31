// src/context/AuthContext.js (TAM KOD)

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    auth, // src/firebaseConfig.js dosyasından içe aktarıldı
    db // src/firebaseConfig.js dosyasından içe aktarıldı
} from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null); 
    const [userRole, setUserRole] = useState(null);       
    const [loading, setLoading] = useState(true);         

    const fetchUserRole = async (user) => {
        if (user) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserRole(docSnap.data().role);
            } else {
                setUserRole(null);
                console.error("Kullanıcı rol bilgisi Firestore'da bulunamadı!");
            }
        } else {
            setUserRole(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            await fetchUserRole(user);
            setLoading(false);
        });

        return unsubscribe; 
    }, []);

    // LOGIN DÜZELTİLDİ: Artık async, LoginPage.js'teki await ile uyumlu.
    const login = async (email, password) => { 
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        userRole,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {loading && <div style={{textAlign: 'center', padding: '50px'}}>Yükleniyor...</div>}
        </AuthContext.Provider>
    );
};