// src/components/Layout.js - TAM KOD

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // AuthContext yolunuzu kontrol edin

const Layout = ({ children }) => {
    // Layout bileşeninin doğru çalışması için Link, useLocation ve useAuth gereklidir.
    const { currentUser, userRole, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Rol adlarını anlaşılır hale getirme
    const getRoleName = (role) => {
        switch (role) {
            case 'admin': return 'Yönetici (Admin)';
            case 'isveren': return 'İşveren';
            case 'isci': return 'İşçi';
            case 'uretici': return 'Üretici';
            default: return 'Misafir';
        }
    };
    
    // Çıkış yapma işlemi
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/', { replace: true });
        } catch (error) {
            console.error("Çıkış yapılırken hata:", error);
            // Uyarı yerine konsola yazdırıyoruz.
        }
    };

    // Yönetim Menüsü öğelerini tanımlama (Yetkilendirme mantığı burada)
    const isAdminOrIsveren = userRole === 'admin' || userRole === 'isveren';

    let navItems = [];
    if (userRole === 'admin') {
        navItems = [
            { name: 'Genel Bakış', path: '/admin' },
            { name: 'Üretici Yönetimi', path: '/admin/producers' },
            { name: 'Kullanıcı & Rol Yönetimi', path: '/admin/roles' },
            { name: 'Ödeme Takibi', path: '/isveren' }, 
            { name: 'Raporlar', path: '/raporlar' }, // YENİ: Raporlar sayfasına yönlendirme
        ];
    } else if (userRole === 'isveren') {
        navItems = [
            // İşveren için sadece ilgili sekmeler
            { name: 'Ödeme Takibi', path: '/isveren' },
            { name: 'Raporlar', path: '/raporlar' }, // YENİ: Raporlar sayfasına yönlendirme
        ];
    }
    // İşçi ve Üretici rolleri için menü, kendi panellerinde olduğu için burada listelenmez.

    return (
        <div style={styles.appContainer}>
            {/* Üst Menü / Navbar */}
            <header style={styles.header}>
                <h1 style={styles.logo}>Sütçü Yönetim Sistemi</h1>
                {currentUser && (
                    <div style={styles.userInfo}>
                        <span style={styles.roleText}>Rol: {getRoleName(userRole)}</span>
                        <button onClick={handleLogout} style={styles.logoutButton}>
                            Çıkış Yap
                        </button>
                    </div>
                )}
            </header>

            {/* İçerik ve Yan Menü (Admin/İşveren için) */}
            <div style={styles.contentWrapper}>
                
                {/* Yan Menü (Sadece Admin/İşveren için) */}
                {isAdminOrIsveren && (
                    <nav style={styles.sidebar}>
                        <h3 style={styles.menuHeader}>Yönetim Menüsü</h3>
                        <ul style={styles.navList}>
                            {navItems.map(item => (
                                <li key={item.path}>
                                    <Link 
                                        to={item.path} 
                                        style={{ 
                                            ...styles.navLink, 
                                            // Şu anki sayfa ise aktif stil uygula
                                            ...(location.pathname === item.path ? styles.activeLink : {}) 
                                        }}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                {/* Ana İçerik Alanı */}
                <main style={{...styles.mainContent, ...(isAdminOrIsveren ? {} : {width: '100%'})}}>
                    {children}
                </main>
            </div>

            {/* Alt Bilgi */}
            <footer style={styles.footer}>
                &copy; 2025 Sütçü Uygulaması
            </footer>
        </div>
    );
};

// --- Stiller ---
const styles = {
    appContainer: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f4f7f6',
    },
    header: {
        backgroundColor: '#007bff',
        color: 'white',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        height: '70px'
    },
    logo: {
        margin: 0,
        fontSize: '24px',
        fontWeight: 'bold',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    roleText: {
        fontSize: '16px',
    },
    logoutButton: {
        backgroundColor: '#dc3545', 
        color: 'white',
        border: 'none',
        padding: '8px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
    },
    contentWrapper: {
        display: 'flex',
        flexGrow: 1,
    },
    sidebar: {
        width: '250px',
        backgroundColor: '#2c3e50', // Koyu gri menü
        color: 'white',
        padding: '20px 0',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    },
    menuHeader: {
        fontSize: '1.2em',
        padding: '0 20px 10px',
        borderBottom: '1px solid #34495e',
        marginBottom: '10px',
        color: '#adb5bd',
    },
    navList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    navLink: {
        display: 'block',
        textDecoration: 'none',
        color: '#ecf0f1', // Açık gri link
        padding: '12px 20px',
        transition: 'background-color 0.3s, color 0.3s',
    },
    activeLink: {
        backgroundColor: '#0056b3', // Vurgu rengi
        color: 'white',
        fontWeight: 'bold',
        borderLeft: '5px solid #ffc107', // Sarı çizgi vurgusu
    },
    mainContent: {
        flexGrow: 1, 
        padding: '20px',
    },
    footer: {
        backgroundColor: '#343a40',
        color: 'white',
        textAlign: 'center',
        padding: '10px 0',
        fontSize: '14px',
    }
};

export default Layout;
