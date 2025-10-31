// src/pages/AdminDashboard.js (TAM KOD)

import React from 'react';
import Layout from '../components/Layout';

const AdminDashboard = () => {
    return (
        <Layout>
            <h1>Yönetici Paneli - Genel Bakış</h1>
            <p>Admin, tüm kullanıcıları, rolleri ve üreticileri buradan yönetebilir.</p>
            {/* Buraya istatistikler ve özet kartlar eklenebilir */}
            <div style={{marginTop: '40px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px'}}>
                <h2>Hoş Geldiniz!</h2>
                <p>Sol menüden Üretici Yönetimi, Rol Yönetimi ve Ödeme Takibi sayfalarına erişebilirsiniz.</p>
            </div>
        </Layout>
    );
};

export default AdminDashboard;