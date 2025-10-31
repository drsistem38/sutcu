// src/pages/LoginPage.js (SON GÜNCEL VE STİLLİ TAM KOD)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login, userRole, currentUser } = useAuth(); 

    // Giriş yapmış ve rolü belirlenmişse yönlendir
    useEffect(() => {
        if (currentUser && userRole) {
            navigate(`/${userRole === 'admin' ? 'admin' : userRole}`, { replace: true });
        }
    }, [currentUser, userRole, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            // Başarılı girişten sonra yönlendirme useEffect ile yapılacaktır.
        } catch (err) {
            console.error("Giriş hatası:", err.message);
            // Firebase hata mesajını daha kullanıcı dostu hale getir
            let errorMessage = "Giriş yapılırken bir hata oluştu. E-posta veya şifre yanlış.";
            if (err.code === 'auth/invalid-credential') {
                 errorMessage = "E-posta veya şifre yanlış.";
            } else if (err.code === 'auth/too-many-requests') {
                 errorMessage = "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Yönlendiriliyorsa veya zaten giriş yapmışsa hiçbir şey gösterme
    if (currentUser) return null;

    // Yönlendirici: LoginPage.js (Basit stil tanımı)
    const style = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f8f9fa'
        },
        form: {
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            width: '350px'
        },
        input: {
            width: '100%',
            padding: '10px',
            margin: '10px 0',
            border: '1px solid #ced4da',
            borderRadius: '4px'
        },
        button: {
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '15px'
        },
        error: {
            color: 'red',
            marginBottom: '10px'
        }
    };
    
    return (
        <div style={style.container}>
            <h1 style={{marginBottom: '20px'}}>Sütçü Uygulaması - Giriş</h1>
            <form onSubmit={handleSubmit} style={style.form}>
                {error && <p style={style.error}>{error}</p>}
                <input
                    type="email"
                    placeholder="E-posta"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={style.input}
                />
                <input
                    type="password"
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={style.input}
                />
                <button type="submit" disabled={isLoading} style={style.button}>
                    {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;