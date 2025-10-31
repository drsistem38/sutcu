// src/components/AdminSidebar.js

import React from 'react';
import { Link } from 'react-router-dom';

const AdminSidebar = () => {
    return (
        <div style={styles.sidebar}>
            <h3 style={styles.header}>Yönetim Menüsü</h3>
            <Link to="/admin" style={styles.link}>📋 Genel Bakış</Link>
            <Link to="/admin/producers" style={styles.link}>🧑‍🌾 Üretici Yönetimi</Link>
            <Link to="/admin/users" style={styles.link}>👥 Kullanıcı & Rol Yönetimi</Link>
            <Link to="/admin/payments" style={styles.link}>💰 Ödeme Takibi</Link>
            <Link to="/admin/reports" style={styles.link}>📊 Raporlar</Link>
        </div>
    );
};

const styles = {
    sidebar: {
        width: '250px',
        padding: '20px',
        backgroundColor: '#343a40', // Koyu renk
        color: 'white',
        minHeight: 'calc(100vh - 80px)', // Header yüksekliği çıkarıldı
    },
    header: {
        marginTop: 0,
        marginBottom: '20px',
        borderBottom: '1px solid #495057',
        paddingBottom: '10px'
    },
    link: {
        display: 'block',
        color: 'white',
        textDecoration: 'none',
        padding: '10px 0',
        borderBottom: '1px solid #495057',
        transition: 'background-color 0.2s',
    }
};

export default AdminSidebar;