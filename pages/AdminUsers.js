// src/pages/AdminUsers.js

import React from 'react';
import useFirestoreCollection from '../hooks/useFirestoreCollection';

// --- Alt Bileşen: İşçi Listesini Gösteren Kısım ---
const IsciList = () => {
    // Sadece role'ü 'isci' olanları çek
    const { data: isciler, loading, error } = useFirestoreCollection('users', [['role', '==', 'isci']]);

    if (loading) return <p>İşçi Listesi Yükleniyor...</p>;
    if (error) return <p style={{ color: 'red' }}>Hata: {error}</p>;
    if (isciler.length === 0) return <p>Sistemde kayıtlı İşçi bulunmamaktadır.</p>;

    return (
        <div style={listStyles.tableContainer}>
            <h3>Kayıtlı İşçiler ({isciler.length})</h3>
            <table style={listStyles.table}>
                <thead>
                    <tr>
                        <th style={listStyles.th}>Adı</th>
                        <th style={listStyles.th}>E-posta</th>
                        <th style={listStyles.th}>UID (Atama İçin Gerekli)</th>
                    </tr>
                </thead>
                <tbody>
                    {isciler.map((isci) => (
                        <tr key={isci.id}>
                            <td style={listStyles.td}>{isci.name || 'Adı Yok'}</td>
                            <td style={listStyles.td}>{isci.email}</td>
                            <td style={listStyles.td}>{isci.id.substring(0, 8)}...</td> {/* UID'nin ilk 8 karakterini göster */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// --- Ana Bileşen: Kullanıcı Yönetimi Sayfası ---
const AdminUsers = () => {
    return (
        <>
            <h1>Kullanıcı & Rol Yönetimi</h1>
            <p>Bu sayfada yeni kullanıcı (İşçi, İşveren, Üretici) ekleyebilir ve rollerini yönetebilirsiniz.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
                {/* Kullanıcı Ekleme Formu (Şimdilik yer tutucu) */}
                <div style={listStyles.container}>
                    <h3>Yeni Kullanıcı Ekle</h3>
                    <p>Buraya Firebase Auth ve Firestore ile kullanıcı oluşturma formu gelecek.</p>
                </div>

                {/* İşçi Listesi */}
                <IsciList />
            </div>
        </>
    );
};

const listStyles = {
    // AdminProducers.js'deki stiller buraya kopyalanmıştır.
    tableContainer: {
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#e9ecef',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '15px',
        backgroundColor: 'white',
    },
    th: {
        border: '1px solid #dee2e6',
        padding: '12px',
        textAlign: 'left',
        backgroundColor: '#007bff',
        color: 'white',
    },
    td: {
        border: '1px solid #dee2e6',
        padding: '10px',
        textAlign: 'left',
        fontSize: '14px' // UID daha küçük görünsün
    },
    container: {
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
    }
};

export default AdminUsers;