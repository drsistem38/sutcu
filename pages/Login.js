// src/pages/Login.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, currentUser, userRole, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Giriş başarılı olduktan sonra kullanıcıyı rolüne göre yönlendir
    useEffect(() => {
        // Context hala yükleniyorsa veya kullanıcı yoksa yönlendirme yapma
        if (authLoading) return;

        if (currentUser && userRole) {
            switch (userRole) {
                case 'admin':
                    navigate('/admin', { replace: true });
                    break;
                case 'isveren':
                    navigate('/isveren', { replace: true });
                    break;
                case 'isci':
                    navigate('/isci', { replace: true });
                    break;
                case 'uretici':
                    navigate('/uretici', { replace: true });
                    break;
                default:
                    // Eğer rol tanımsızsa, güvenlik için çıkış yap
                    alert("HATA: Tanımsız kullanıcı rolü!");
                    // logout(); // İstenirse otomatik çıkış da eklenebilir.
            }
        }
    }, [currentUser, userRole, authLoading, navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // useAuth context'inden gelen login fonksiyonunu kullan
            await login(email, password);
            // Yönlendirme useEffect içinde yapılacak
        } catch (err) {
            // Firebase Hata Kodlarına göre mesaj göster
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('E-posta veya şifre hatalı. Lütfen kontrol edin.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Lütfen geçerli bir e-posta adresi girin.');
            } else {
                setError('Giriş yapılırken bir hata oluştu: ' + err.message);
            }
            setLoading(false); // Giriş başarısız olduysa yüklemeyi bitir
        }
    };

    // Eğer kullanıcı zaten giriş yapmışsa, Login sayfasını gösterme
    if (currentUser && userRole) {
         return <div style={{textAlign: 'center', padding: '50px'}}>Yönlendiriliyor...</div>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Sütçü Uygulaması - Giriş</h2>
            {error && <p style={styles.error}>{error}</p>}

            <form onSubmit={handleSubmit} style={styles.form}>
                <input 
                    type="email" 
                    placeholder="E-posta" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.input}
                />
                <input 
                    type="password" 
                    placeholder="Şifre" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={styles.input}
                />

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#f9f9f9'
    },
    header: {
        textAlign: 'center',
        color: '#007bff'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    input: {
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd'
    },
    button: {
        padding: '10px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
        cursor: 'pointer',
        fontSize: '16px'
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: '15px'
    }
};

export default Login;